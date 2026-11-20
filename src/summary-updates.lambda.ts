import { Handler, SQSEvent, SQSBatchResponse } from 'aws-lambda';
import { NestFactory } from '@nestjs/core';
import { INestApplicationContext, Logger } from '@nestjs/common';
import { SSMClient } from '@aws-sdk/client-ssm';
import { SummaryUpdatesModule } from './summary-updates/summary-updates.module';
import { SummaryCentroRefreshService } from './application/summary/summary-centro-refresh.service';
import { isMemoryDriver } from './infra/persistence/persistence.config';
import { ParameterStoreService } from './services/parameter-store.service';
import { parseSummaryRefreshEvent } from './summary-updates/summary-refresh.event';

export interface SummaryRefreshProcessor {
  refresh(centroId: string): Promise<void>;
}

const logger = new Logger('SummaryUpdatesLambda');
let applicationContext: INestApplicationContext | undefined;

export async function processSummaryRefreshBatch(
  event: SQSEvent,
  processor: SummaryRefreshProcessor,
): Promise<SQSBatchResponse> {
  const batchItemFailures: SQSBatchResponse['batchItemFailures'] = [];

  for (const record of event.Records) {
    let refreshEvent;
    try {
      refreshEvent = parseSummaryRefreshEvent(JSON.parse(record.body));
    } catch (error) {
      logger.error(
        `Invalid summary refresh message ${record.messageId}`,
        error instanceof Error ? error.message : String(error),
      );
      batchItemFailures.push({ itemIdentifier: record.messageId });
      continue;
    }

    try {
      await processor.refresh(refreshEvent.centroId);
    } catch (error) {
      logger.error(
        `Failed to refresh center ${refreshEvent.centroId} from summary ${refreshEvent.summaryId}`,
        error instanceof Error ? error.stack : String(error),
      );
      batchItemFailures.push({ itemIdentifier: record.messageId });
    }
  }

  return { batchItemFailures };
}

async function loadWorkerParameters(): Promise<void> {
  if (!process.env.PARAMETER_ENVIRONMENT?.trim() || isMemoryDriver()) return;

  const client = new SSMClient({ region: process.env.AWS_REGION });
  try {
    const parameters = await new ParameterStoreService(client).load([
      'MONGODB_URI',
      'GEOAPIFY_API_KEY',
    ]);
    Object.assign(process.env, parameters);
  } finally {
    client.destroy();
  }
}

export const handler: Handler<SQSEvent, SQSBatchResponse> = async (
  event,
  context,
) => {
  context.callbackWaitsForEmptyEventLoop = false;
  await loadWorkerParameters();

  if (!applicationContext) {
    applicationContext =
      await NestFactory.createApplicationContext(SummaryUpdatesModule);
  }

  const processor = applicationContext.get(SummaryCentroRefreshService);
  return processSummaryRefreshBatch(event, processor);
};
