import { Inject, Injectable } from '@nestjs/common';
import { PublishCommand, SNSClient } from '@aws-sdk/client-sns';
import { SummaryRefreshEvent } from '../../summary-updates/summary-refresh.event';

export const SUMMARY_REFRESH_SNS_CLIENT = Symbol(
  'SUMMARY_REFRESH_SNS_CLIENT',
);
export const SUMMARY_CENTER_REFRESH_TOPIC_ARN = Symbol(
  'SUMMARY_CENTER_REFRESH_TOPIC_ARN',
);

@Injectable()
export class SummaryRefreshPublisher {
  constructor(
    @Inject(SUMMARY_REFRESH_SNS_CLIENT)
    private readonly client: SNSClient,
    @Inject(SUMMARY_CENTER_REFRESH_TOPIC_ARN)
    private readonly topicArn: string,
  ) {}

  async publish(event: SummaryRefreshEvent): Promise<void> {
    if (!this.topicArn) {
      throw new Error('SUMMARY_CENTER_REFRESH_TOPIC_ARN is not configured');
    }

    await this.client.send(
      new PublishCommand({
        TopicArn: this.topicArn,
        Message: JSON.stringify(event),
      }),
    );
  }
}
