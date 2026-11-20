import { Inject, Injectable } from '@nestjs/common';
import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';

export const DASHBOARD_PROJECTIONS_SQS_CLIENT = Symbol(
  'DASHBOARD_PROJECTIONS_SQS_CLIENT',
);
export const DASHBOARD_PROJECTIONS_QUEUE_URL = Symbol(
  'DASHBOARD_PROJECTIONS_QUEUE_URL',
);

export type CenterFinishedEvent = {
  schemaVersion: 'center.finished.v1';
  eventId: string;
  centerId: string;
  regionId: string;
  cycleId: string;
  logicalVersion: number;
  occurredAt: string;
  responded: true;
  finished: true;
  activityDate: string;
  activityCount: number;
};

@Injectable()
export class DashboardProjectionEventsService {
  constructor(
    @Inject(DASHBOARD_PROJECTIONS_SQS_CLIENT)
    private readonly client: SQSClient,
    @Inject(DASHBOARD_PROJECTIONS_QUEUE_URL)
    private readonly queueUrl: string,
  ) {}

  async publishCenterFinished(event: CenterFinishedEvent): Promise<void> {
    if (!this.queueUrl) {
      throw new Error('DASHBOARD_PROJECTIONS_QUEUE_URL is not configured');
    }

    await this.client.send(
      new SendMessageCommand({
        QueueUrl: this.queueUrl,
        MessageBody: JSON.stringify(event),
      }),
    );
  }
}
