import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import {
  chmodSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
const expectedAccount = '115186094843';

function createHarness(t, accountId = expectedAccount) {
  const root = mkdtempSync(path.join(os.tmpdir(), 'deploy-safety-'));
  const bin = path.join(root, 'bin');
  const scripts = path.join(root, 'scripts');
  mkdirSync(bin);
  mkdirSync(scripts);
  mkdirSync(path.join(root, 'infra'));
  mkdirSync(path.join(root, 'dist'));
  writeFileSync(path.join(root, 'package.json'), '{}');
  writeFileSync(path.join(root, 'package-lock.json'), '{}');
  writeFileSync(path.join(root, 'infra', 'terraform.tfvars'), '');
  writeFileSync(path.join(root, 'dist', 'index.js'), '');
  copyFileSync(
    path.join(repositoryRoot, 'scripts', 'deploy.sh'),
    path.join(scripts, 'deploy.sh'),
  );
  chmodSync(path.join(scripts, 'deploy.sh'), 0o755);

  const logPath = path.join(root, 'commands.log');
  const writeExecutable = (name, contents) => {
    const executable = path.join(bin, name);
    writeFileSync(executable, `#!/usr/bin/env bash\n${contents}\n`);
    chmodSync(executable, 0o755);
  };

  writeExecutable(
    'aws',
    `printf 'aws %s\\n' "$*" >> "$DEPLOY_TEST_LOG"
if [[ "$*" == *"get-alias"*"$DEPLOY_TEST_WORKER_FUNCTION_NAME"* && "\${DEPLOY_TEST_NO_WORKER_ALIAS:-false}" == "true" ]]; then
  echo "An error occurred (ResourceNotFoundException) while reading worker alias" >&2
  exit 255
fi
case "$*" in
  *"sts get-caller-identity"*) printf '%s\\n' "$DEPLOY_TEST_ACCOUNT_ID" ;;
  *"get-alias"*"--name candidate"*) printf '2\\n' ;;
  *"get-alias"*) printf '1\\n' ;;
  *"get-function-configuration"*) printf 'false\\n' ;;
  *"publish-version"*) printf '1\\n' ;;
esac`,
  );
  writeExecutable(
    'terraform',
    `printf 'terraform %s\\n' "$*" >> "$DEPLOY_TEST_LOG"
if [[ "$1" == "plan" || "$1" == "apply" ]]; then
  printf '  - "LOCATION_UPDATE_TOKEN" = "redaction-canary-value"\\n'
fi
if [[ "$1" == "plan" ]]; then
  for arg in "$@"; do
    case "$arg" in
      -out=*) : > "\${arg#-out=}" ;;
    esac
  done
fi`,
  );
  writeExecutable(
    'npm',
    `printf 'npm %s\\n' "$*" >> "$DEPLOY_TEST_LOG"`,
  );
  writeExecutable(
    'zip',
    `printf 'zip %s\\n' "$*" >> "$DEPLOY_TEST_LOG"
: > "$2"`,
  );

  t.after(() => rmSync(root, { recursive: true, force: true }));
  const run = (args = [], env = {}) =>
    spawnSync('bash', [path.join(scripts, 'deploy.sh'), ...args], {
      cwd: root,
      encoding: 'utf8',
      env: {
        ...process.env,
        PATH: `${bin}${path.delimiter}${process.env.PATH}`,
        DEPLOY_TEST_LOG: logPath,
        DEPLOY_TEST_ACCOUNT_ID: accountId,
        DEPLOY_TEST_WORKER_FUNCTION_NAME:
          'aee-digital-summary-center-refresh-worker',
        AWS_PROFILE: 'test-profile',
        ...env,
      },
    });

  const log = () =>
    existsSync(logPath)
      ? readFileSync(logPath, 'utf8').split('\n').filter(Boolean)
      : [];

  return { root, run, log };
}

test('default deploy never applies Terraform changes', (t) => {
  const harness = createHarness(t);
  const result = harness.run();

  assert.equal(result.status, 0, result.stderr);
  assert.doesNotMatch(result.stdout, /redaction-canary-value/);
  assert.match(result.stdout, /LOCATION_UPDATE_TOKEN.*<redacted>/);
  assert.equal(
    harness.log().some((command) => command.startsWith('terraform apply')),
    false,
  );
});

test('plan mode uses Terraform plan without resource mutations', (t) => {
  const harness = createHarness(t);
  const result = harness.run(['plan']);
  const commands = harness.log();

  assert.equal(result.status, 0, result.stderr);
  assert.equal(
    commands.some((command) => command.startsWith('terraform plan')),
    true,
  );
  assert.equal(
    commands.some((command) => command.startsWith('terraform apply')),
    false,
  );
  const planCommand = commands.find((command) =>
    command.startsWith('terraform plan'),
  );
  assert.match(planCommand, /-var=api_live_version=1/);
  assert.match(planCommand, /-var=worker_live_version=1/);
  assert.match(planCommand, /-var=summary_center_refresh_enabled=false/);
  assert.equal(
    commands.some((command) => /aws .*lambda (publish-version|update-alias)/.test(command)),
    false,
  );
});

test('first worker plan allows no existing worker alias but pins the live API', (t) => {
  const harness = createHarness(t);
  const result = harness.run(['plan'], {
    DEPLOY_TEST_NO_WORKER_ALIAS: 'true',
  });
  const planCommand = harness
    .log()
    .find((command) => command.startsWith('terraform plan'));

  assert.equal(result.status, 0, result.stderr);
  assert.match(planCommand, /-var=api_live_version=1/);
  assert.doesNotMatch(planCommand, /-var=worker_live_version=/);
});

test('promotion plans pin both live aliases to candidate versions', (t) => {
  const harness = createHarness(t);
  const result = harness.run([
    'plan',
    '--target',
    'promotion',
    '--enable-refresh',
  ]);
  const planCommand = harness
    .log()
    .find((command) => command.startsWith('terraform plan'));

  assert.equal(result.status, 0, result.stderr);
  assert.match(planCommand, /-var=api_live_version=2/);
  assert.match(planCommand, /-var=worker_live_version=2/);
  assert.match(planCommand, /-var=summary_center_refresh_enabled=true/);
});

test('apply requires explicit confirmation and the approved AWS account', (t) => {
  const missingConfirmation = createHarness(t);
  const missingResult = missingConfirmation.run(['apply', '/tmp/reviewed.tfplan']);

  assert.notEqual(missingResult.status, 0);
  assert.match(missingResult.stderr + missingResult.stdout, /confirm|approval/i);
  assert.equal(
    missingConfirmation.log().some((command) => command.startsWith('terraform apply')),
    false,
  );

  const wrongAccount = createHarness(t, '999999999999');
  const wrongResult = wrongAccount.run([
    'apply',
    '/tmp/reviewed.tfplan',
    '--confirm-account',
    '115186094843',
  ]);

  assert.notEqual(wrongResult.status, 0);
  assert.match(wrongResult.stderr + wrongResult.stdout, /account|115186094843/i);
  assert.equal(
    wrongAccount.log().some((command) => command.startsWith('terraform apply')),
    false,
  );
});

test('promotion requires confirmation before changing aliases', (t) => {
  const harness = createHarness(t);
  const result = harness.run(['promote', '/tmp/promotion.tfplan']);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr + result.stdout, /confirm|approval/i);
  assert.equal(
    harness.log().some((command) => /aws .*lambda update-alias/.test(command)),
    false,
  );
});

test('confirmed apply applies only the reviewed plan for the approved account', (t) => {
  const harness = createHarness(t);
  const planPath = path.join(os.tmpdir(), 'reviewed-deploy.tfplan');
  const planContents = 'fake-plan';
  const artifactContents = 'fake-artifact';
  writeFileSync(planPath, planContents);
  writeFileSync(`${planPath}.sha256`, `${createHash('sha256').update(planContents).digest('hex')}\n`);
  writeFileSync(
    `${planPath}.artifact.sha256`,
    `${createHash('sha256').update(artifactContents).digest('hex')}\n`,
  );
  writeFileSync(`${planPath}.target`, 'infrastructure\n');
  writeFileSync(path.join(harness.root, 'dist.zip'), artifactContents);
  t.after(() => {
    rmSync(planPath, { force: true });
    rmSync(`${planPath}.sha256`, { force: true });
    rmSync(`${planPath}.artifact.sha256`, { force: true });
    rmSync(`${planPath}.target`, { force: true });
  });
  const result = harness.run([
    'apply',
    planPath,
    '--confirm-account',
    expectedAccount,
  ]);

  assert.equal(result.status, 0, result.stderr);
  assert.doesNotMatch(result.stdout, /redaction-canary-value/);
  assert.match(result.stdout, /LOCATION_UPDATE_TOKEN.*<redacted>/);
  assert.equal(
    harness
      .log()
      .some((command) => command === `terraform apply -input=false ${planPath}`),
    true,
  );
});
