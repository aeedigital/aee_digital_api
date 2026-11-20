import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const expectedAccountId = '115186094843';
const project = process.env.PARAMETER_PROJECT?.trim();
const environment = process.env.PARAMETER_ENVIRONMENT?.trim();
const region = process.env.AWS_REGION?.trim() || 'us-east-1';
const apiFunction = process.env.DEPLOY_API_FUNCTION_NAME || `${project}-api`;
const workerFunction =
  process.env.DEPLOY_WORKER_FUNCTION_NAME ||
  `${project}-summary-center-refresh-worker`;

function awsJson(args) {
  const output = execFileSync('aws', [...args, '--region', region, '--no-cli-pager'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return JSON.parse(output);
}

function awsText(args) {
  return execFileSync(
    'aws',
    [...args, '--region', region, '--no-cli-pager'],
    {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  ).trim();
}

function requireVersion(functionName, alias) {
  const version = awsText([
    'lambda',
    'get-alias',
    '--function-name',
    functionName,
    '--name',
    alias,
    '--query',
    'FunctionVersion',
    '--output',
    'text',
  ]);
  assert.match(version, /^[1-9][0-9]*$/, `${functionName}:${alias} is not a published alias`);
  return version;
}

function invokeCandidate(functionName, payload, outputPath) {
  const metadata = awsJson([
    'lambda',
    'invoke',
    '--function-name',
    functionName,
    '--qualifier',
    'candidate',
    '--invocation-type',
    'RequestResponse',
    '--cli-binary-format',
    'raw-in-base64-out',
    '--payload',
    JSON.stringify(payload),
    outputPath,
  ]);
  assert.equal(metadata.StatusCode, 200);
  assert.equal(metadata.FunctionError, undefined);
  return JSON.parse(readFileSync(outputPath, 'utf8'));
}

async function main() {
  assert.match(project || '', /^[A-Za-z0-9_-]+$/, 'PARAMETER_PROJECT is required');
  assert.match(
    environment || '',
    /^[A-Za-z0-9_-]+$/,
    'PARAMETER_ENVIRONMENT is required',
  );

  const accountId = awsText([
    'sts',
    'get-caller-identity',
    '--query',
    'Account',
    '--output',
    'text',
  ]);
  assert.equal(
    accountId,
    expectedAccountId,
    `Refusing candidate smoke checks in AWS account ${accountId}`,
  );

  const apiLiveVersion = requireVersion(apiFunction, 'live');
  const apiCandidateVersion = requireVersion(apiFunction, 'candidate');
  const workerLiveVersion = requireVersion(workerFunction, 'live');
  const workerCandidateVersion = requireVersion(workerFunction, 'candidate');

  const parameterPrefix = `/${project}/${environment}/`;
  const parameterResponse = awsJson([
    'ssm',
    'describe-parameters',
    '--parameter-filters',
    `Key=Name,Option=BeginsWith,Values=${parameterPrefix}`,
    '--output',
    'json',
  ]);
  const parameterTypes = new Map(
    (parameterResponse.Parameters || []).map(({ Name, Type }) => [Name, Type]),
  );
  for (const name of [
    'MONGODB_URI',
    'LOCATION_UPDATE_TOKEN',
    'GEOAPIFY_API_KEY',
  ]) {
    assert.equal(
      parameterTypes.get(`${parameterPrefix}${name}`),
      'SecureString',
      `Missing SecureString parameter metadata for ${name}`,
    );
  }

  const topicName = `${project}-center-summary-refresh`;
  const topicResponse = awsJson(['sns', 'list-topics', '--output', 'json']);
  const topicArn = (topicResponse.Topics || []).find(({ TopicArn }) =>
    TopicArn.endsWith(`:${topicName}`),
  )?.TopicArn;
  assert.ok(topicArn, `SNS topic ${topicName} was not found`);

  const queueName = `${project}-center-summary-refresh`;
  const queueUrl = awsText([
    'sqs',
    'get-queue-url',
    '--queue-name',
    queueName,
    '--query',
    'QueueUrl',
    '--output',
    'text',
  ]);
  const queueArn = awsText([
    'sqs',
    'get-queue-attributes',
    '--queue-url',
    queueUrl,
    '--attribute-names',
    'QueueArn',
    '--query',
    'Attributes.QueueArn',
    '--output',
    'text',
  ]);

  const subscriptions = awsJson([
    'sns',
    'list-subscriptions-by-topic',
    '--topic-arn',
    topicArn,
    '--output',
    'json',
  ]);
  const subscription = (subscriptions.Subscriptions || []).find(
    (item) => item.Protocol === 'sqs' && item.Endpoint === queueArn,
  );
  assert.ok(subscription?.SubscriptionArn, 'SNS-to-SQS subscription is not confirmed');
  const subscriptionAttributes = awsJson([
    'sns',
    'get-subscription-attributes',
    '--subscription-arn',
    subscription.SubscriptionArn,
    '--output',
    'json',
  ]);
  assert.equal(
    subscriptionAttributes.Attributes?.RawMessageDelivery,
    'true',
    'SNS raw message delivery is not enabled',
  );

  const queueAttributes = awsJson([
    'sqs',
    'get-queue-attributes',
    '--queue-url',
    queueUrl,
    '--attribute-names',
    'Policy',
    'RedrivePolicy',
    'VisibilityTimeout',
    '--output',
    'json',
  ]);
  const queuePolicy = JSON.parse(queueAttributes.Attributes.Policy);
  assert.ok(
    queuePolicy.Statement.some(
      (statement) =>
        statement.Action === 'sqs:SendMessage' &&
        statement.Condition?.ArnEquals?.['aws:SourceArn'] === topicArn,
    ),
    'Queue policy does not restrict delivery to the summary refresh topic',
  );
  const redrivePolicy = JSON.parse(queueAttributes.Attributes.RedrivePolicy);
  assert.ok(redrivePolicy.deadLetterTargetArn, 'Queue has no dead-letter target');
  assert.ok(Number(redrivePolicy.maxReceiveCount) >= 5);

  const workerConfig = awsJson([
    'lambda',
    'get-function-configuration',
    '--function-name',
    workerFunction,
    '--qualifier',
    'candidate',
    '--output',
    'json',
  ]);
  assert.ok(
    Number(queueAttributes.Attributes.VisibilityTimeout) >=
      Number(workerConfig.Timeout) * 6,
    'Queue visibility timeout is less than six times the worker timeout',
  );

  const mappings = awsJson([
    'lambda',
    'list-event-source-mappings',
    '--event-source-arn',
    queueArn,
    '--output',
    'json',
  ]);
  const mapping = (mappings.EventSourceMappings || []).find((item) =>
    item.FunctionArn?.includes(`${workerFunction}:live`),
  );
  assert.ok(mapping, 'SQS event source mapping for the live worker was not found');
  assert.equal(mapping.State, 'Disabled', 'SQS event source mapping must remain disabled');
  assert.ok(
    mapping.FunctionResponseTypes?.includes('ReportBatchItemFailures'),
    'SQS event source mapping does not report partial batch failures',
  );

  const outputDirectory = mkdtempSync(
    path.join(os.tmpdir(), 'summary-center-candidate-smoke-'),
  );
  try {
    const apiOutput = path.join(outputDirectory, 'api-response.json');
    const apiResponse = invokeCandidate(
      apiFunction,
      {
        resource: '/',
        path: '/',
        httpMethod: 'GET',
        headers: { 'User-Agent': 'summary-center-candidate-smoke' },
        multiValueHeaders: {},
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        pathParameters: null,
        stageVariables: null,
        requestContext: {
          resourcePath: '/',
          httpMethod: 'GET',
          path: '/candidate/',
          stage: 'candidate',
          requestId: 'candidate-smoke',
          identity: { sourceIp: '127.0.0.1' },
          apiId: 'candidate-smoke',
          protocol: 'HTTP/1.1',
          requestTimeEpoch: Date.now(),
        },
        body: null,
        isBase64Encoded: false,
      },
      apiOutput,
    );
    assert.equal(apiResponse.statusCode, 200);
    assert.match(apiResponse.body, /Hello World!/);

    const workerOutput = path.join(outputDirectory, 'worker-response.json');
    const workerResponse = invokeCandidate(
      workerFunction,
      {
        Records: [
          {
            messageId: 'candidate-smoke-invalid',
            body: '{}',
          },
        ],
      },
      workerOutput,
    );
    assert.deepEqual(workerResponse, {
      batchItemFailures: [{ itemIdentifier: 'candidate-smoke-invalid' }],
    });
  } finally {
    rmSync(outputDirectory, { recursive: true, force: true });
  }

  console.log(
    `Candidate checks passed in account ${accountId}: API ${apiLiveVersion}->${apiCandidateVersion}, worker ${workerLiveVersion}->${workerCandidateVersion}; SSM metadata, SNS/SQS wiring, and disabled mapping verified.`,
  );
}

main().catch((error) => {
  console.error(`Candidate smoke checks failed: ${error.message}`);
  process.exitCode = 1;
});
