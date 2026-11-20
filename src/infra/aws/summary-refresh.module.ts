import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SNSClient } from '@aws-sdk/client-sns';
import {
  SUMMARY_CENTER_REFRESH_TOPIC_ARN,
  SUMMARY_REFRESH_SNS_CLIENT,
  SummaryRefreshPublisher,
} from './summary-refresh.publisher';

@Module({
  providers: [
    {
      provide: SUMMARY_REFRESH_SNS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        new SNSClient({
          region: config.get<string>('AWS_REGION') || 'us-east-1',
        }),
    },
    {
      provide: SUMMARY_CENTER_REFRESH_TOPIC_ARN,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        config.get<string>('SUMMARY_CENTER_REFRESH_TOPIC_ARN')?.trim() || '',
    },
    SummaryRefreshPublisher,
  ],
  exports: [SummaryRefreshPublisher],
})
export class SummaryRefreshModule {}
