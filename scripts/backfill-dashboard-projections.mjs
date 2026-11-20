#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const DEFAULT_API_URL =
  'https://vf7xhmyixb.execute-api.us-east-1.amazonaws.com/prod';
const DEFAULT_QUEUE_URL =
  'https://sqs.us-east-1.amazonaws.com/115186094843/dashboard-projections-queue';
const DEFAULT_DLQ_URL =
  'https://sqs.us-east-1.amazonaws.com/115186094843/dashboard-projections-dlq';

function option(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function aws(args, profile, region) {
  const output = execFileSync(
    'aws',
    [...args, '--profile', profile, '--region', region, '--output', 'json'],
    { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 },
  );
  return output.trim() ? JSON.parse(output) : {};
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`GET ${url} returned HTTP ${response.status}`);
  }
  return response.json();
}

function isoDateFromBrazil(value) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value || '');
  if (!match) throw new Error(`Invalid Brazilian date: ${value}`);
  return `${match[3]}-${match[2]}-${match[1]}`;
}

function timestamp(value) {
  let result = Date.parse(value || '');
  if (!Number.isFinite(result) && /T24:/.test(value || '')) {
    result = Date.parse(value.replace('T24:', 'T00:')) + 24 * 60 * 60 * 1000;
  }
  if (!Number.isFinite(result)) throw new Error(`Invalid timestamp: ${value}`);
  return result;
}

function dateUTC(value) {
  return new Date(timestamp(value)).toISOString().slice(0, 10);
}

function chunks(items, size) {
  return Array.from(
    { length: Math.ceil(items.length / size) },
    (_, index) => items.slice(index * size, index * size + size),
  );
}

function queueDepth(queueUrl, profile, region) {
  const response = aws(
    [
      'sqs',
      'get-queue-attributes',
      '--queue-url',
      queueUrl,
      '--attribute-names',
      'ApproximateNumberOfMessages',
      'ApproximateNumberOfMessagesNotVisible',
      'ApproximateNumberOfMessagesDelayed',
    ],
    profile,
    region,
  );
  const attributes = response.Attributes || {};
  return {
    visible: Number(attributes.ApproximateNumberOfMessages || 0),
    inFlight: Number(attributes.ApproximateNumberOfMessagesNotVisible || 0),
    delayed: Number(attributes.ApproximateNumberOfMessagesDelayed || 0),
  };
}

function existingCenterIds(tableName, cycleId, profile, region) {
  const response = aws(
    [
      'dynamodb',
      'scan',
      '--table-name',
      tableName,
      '--filter-expression',
      'begins_with(pk, :prefix) AND attribute_exists(centerId)',
      '--expression-attribute-values',
      JSON.stringify({ ':prefix': { S: `CYCLE#${cycleId}#CENTER#` } }),
      '--projection-expression',
      'centerId',
    ],
    profile,
    region,
  );
  return new Set(
    (response.Items || []).map((item) => item.centerId?.S).filter(Boolean),
  );
}

async function waitForQueue(queueUrl, profile, region, timeoutSeconds) {
  const deadline = Date.now() + timeoutSeconds * 1000;
  let last;
  while (Date.now() < deadline) {
    last = queueDepth(queueUrl, profile, region);
    console.log(
      `Queue: visible=${last.visible}, inFlight=${last.inFlight}, delayed=${last.delayed}`,
    );
    if (last.visible === 0 && last.inFlight === 0 && last.delayed === 0) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  throw new Error(`Queue did not drain within ${timeoutSeconds}s: ${JSON.stringify(last)}`);
}

async function invokeProjection(payload, functionName, profile, region, workDir) {
  const outputPath = join(workDir, `invoke-${payload.scopeType}.json`);
  const metadata = aws(
    [
      'lambda',
      'invoke',
      '--function-name',
      functionName,
      '--cli-binary-format',
      'raw-in-base64-out',
      '--payload',
      JSON.stringify(payload),
      outputPath,
    ],
    profile,
    region,
  );
  if (metadata.StatusCode !== 200 || metadata.FunctionError) {
    throw new Error(`Projection query failed: ${JSON.stringify(metadata)}`);
  }
  return JSON.parse(await readFile(outputPath, 'utf8'));
}

function assertTotals(actual, expected, label) {
  for (const field of ['totalCenters', 'respondingCenters', 'finishedCenters']) {
    if (actual?.[field] !== expected) {
      throw new Error(
        `${label}.${field}: expected ${expected}, received ${actual?.[field]}`,
      );
    }
  }
}

function canonicalDaily(value) {
  return Object.fromEntries(
    Object.entries(value || {}).sort(([left], [right]) =>
      left.localeCompare(right),
    ),
  );
}

async function run() {
  const apply = hasFlag('--apply');
  const apiUrl = option('--api-url', DEFAULT_API_URL).replace(/\/$/, '');
  const queueUrl = option('--queue-url', DEFAULT_QUEUE_URL);
  const dlqUrl = option('--dlq-url', DEFAULT_DLQ_URL);
  const profile = option('--profile', 'bruno');
  const region = option('--region', 'us-east-1');
  const functionName = option('--function-name', 'dashboard-projections');
  const tableName = option('--table-name', 'dashboard-projections-table');
  const timeoutSeconds = Number(option('--timeout-seconds', '180'));
  const workDir = await mkdtemp(join(tmpdir(), 'aee-projections-backfill-'));

  try {
    const active = await fetchJson(`${apiUrl}/cadastro-info/active`);
    const cycleId = active.CYCLE_ID || active._id;
    const from = isoDateFromBrazil(active.START_DATE);
    const to = isoDateFromBrazil(active.END_DATE);
    if (!cycleId) throw new Error('Active cycle does not contain CYCLE_ID or _id');

    const summaryQuery = new URLSearchParams({
      dateFrom: from,
      dateTo: to,
      fields: 'CENTRO_ID,createdAt,updatedAt',
      sort: 'createdAt:1',
    });
    const [centers, summaries] = await Promise.all([
      fetchJson(`${apiUrl}/centros?fields=REGIONAL`),
      fetchJson(`${apiUrl}/summaries?${summaryQuery}`),
    ]);

    const centersById = new Map(
      centers.map((center) => [center._id, center]),
    );
    const summariesByCenter = new Map();
    for (const summary of summaries) {
      const current = summariesByCenter.get(summary.CENTRO_ID) || [];
      current.push(summary);
      summariesByCenter.set(summary.CENTRO_ID, current);
    }

    const events = [];
    const expectedByRegion = new Map();
    const expectedDaily = {};
    const orphanSummaryCenters = [];
    for (const [centerId, items] of summariesByCenter) {
      const center = centersById.get(centerId);
      if (!center?.REGIONAL) {
        orphanSummaryCenters.push(centerId);
        continue;
      }
      const sorted = [...items].sort(
        (left, right) => timestamp(left.createdAt) - timestamp(right.createdAt),
      );
      const latest = sorted.at(-1);
      const activityDate = dateUTC(latest.createdAt);
      const sameDay = sorted.filter(
        (summary) => dateUTC(summary.createdAt) === activityDate,
      );
      const logicalVersion = Math.max(
        ...sorted.map((summary) =>
          timestamp(summary.updatedAt || summary.createdAt),
        ),
      );
      events.push({
        schemaVersion: 'center.finished.v1',
        eventId: `backfill-${cycleId}-${latest._id}`,
        centerId,
        regionId: center.REGIONAL,
        cycleId,
        logicalVersion,
        occurredAt: new Date(
          timestamp(latest.updatedAt || latest.createdAt),
        ).toISOString(),
        responded: true,
        finished: true,
        activityDate,
        activityCount: sameDay.length,
      });
      expectedByRegion.set(
        center.REGIONAL,
        (expectedByRegion.get(center.REGIONAL) || 0) + 1,
      );
      expectedDaily[activityDate] =
        (expectedDaily[activityDate] || 0) + sameDay.length;
    }

    events.sort((left, right) => left.centerId.localeCompare(right.centerId));
    const report = {
      mode: apply ? 'apply' : 'dry-run',
      cycleId,
      from,
      to,
      totalCenters: centers.length,
      summaries: summaries.length,
      finishedCenters: events.length,
      centersWithoutSummary: centers.length - events.length,
      orphanSummaryCenters,
      regionalCount: expectedByRegion.size,
      dailyActivity: expectedDaily,
      firstEvent: events[0],
    };
    console.log(JSON.stringify(report, null, 2));

    if (!apply) {
      console.log('\nDry-run only. Pass --apply to publish the messages.');
      return;
    }

    const existing = existingCenterIds(tableName, cycleId, profile, region);
    const pendingEvents = events.filter((event) => !existing.has(event.centerId));
    console.log(
      `Existing projections=${existing.size}, pending messages=${pendingEvents.length}`,
    );
    const dlqBeforeDepth = queueDepth(dlqUrl, profile, region);
    const dlqBefore = dlqBeforeDepth.visible + dlqBeforeDepth.inFlight;
    let sent = 0;
    for (const [batchIndex, batch] of chunks(pendingEvents, 10).entries()) {
      const inputPath = join(workDir, `sqs-batch-${batchIndex}.json`);
      await writeFile(
        inputPath,
        JSON.stringify({
          QueueUrl: queueUrl,
          Entries: batch.map((event, index) => ({
            Id: `message-${index}`,
            MessageBody: JSON.stringify(event),
          })),
        }),
      );
      const response = aws(
        ['sqs', 'send-message-batch', '--cli-input-json', `file://${inputPath}`],
        profile,
        region,
      );
      if (response.Failed?.length) {
        throw new Error(`SQS batch ${batchIndex} failed: ${JSON.stringify(response.Failed)}`);
      }
      sent += response.Successful?.length || 0;
      console.log(`Published ${sent}/${pendingEvents.length}`);
      await waitForQueue(queueUrl, profile, region, timeoutSeconds);
    }
    if (sent !== pendingEvents.length) {
      throw new Error(
        `Expected to publish ${pendingEvents.length}, published ${sent}`,
      );
    }

    await waitForQueue(queueUrl, profile, region, timeoutSeconds);
    const dlqAfterDepth = queueDepth(dlqUrl, profile, region);
    const dlqAfter = dlqAfterDepth.visible + dlqAfterDepth.inFlight;
    if (dlqAfter !== dlqBefore) {
      throw new Error(`DLQ changed from ${dlqBefore} to ${dlqAfter}`);
    }

    const global = await invokeProjection(
      {
        schemaVersion: 'projection.query.v1',
        scopeType: 'global',
        cycleId,
        from,
        to,
      },
      functionName,
      profile,
      region,
      workDir,
    );
    if (!global.found) throw new Error('Global projection was not created');
    assertTotals(global.totals, events.length, 'global');
    if (
      JSON.stringify(canonicalDaily(global.dailyActivity)) !==
      JSON.stringify(canonicalDaily(expectedDaily))
    ) {
      throw new Error('Global dailyActivity differs from the generated backfill');
    }

    const regionIds = [...expectedByRegion.keys()].sort();
    const regional = await invokeProjection(
      {
        schemaVersion: 'projection.query.batch.v1',
        scopeType: 'region',
        scopeIds: regionIds,
        cycleId,
        from,
        to,
      },
      functionName,
      profile,
      region,
      workDir,
    );
    for (const item of regional.items || []) {
      const expected = expectedByRegion.get(item.scopeId);
      if (!item.found || expected === undefined) {
        throw new Error(`Regional projection missing for ${item.scopeId}`);
      }
      assertTotals(item.totals, expected, `region.${item.scopeId}`);
    }

    console.log(
      JSON.stringify(
        {
          status: 'ok',
          sent,
          dlqBefore,
          dlqAfter,
          global: global.totals,
          auditedRegions: regional.items?.length || 0,
        },
        null,
        2,
      ),
    );
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}

run().catch((error) => {
  console.error(error instanceof Error ? error.stack : error);
  process.exitCode = 1;
});
