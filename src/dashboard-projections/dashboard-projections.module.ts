import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LambdaClient } from '@aws-sdk/client-lambda';
import {
  DASHBOARD_LAMBDA_CLIENT,
  DASHBOARD_PROJECTIONS_FUNCTION_NAME,
  DashboardProjectionsService,
} from './dashboard-projections.service';
import { CadastroInfoModule } from '../cadastro-info/cadastro-info.module';
import { DashboardProjectionsController } from './dashboard-projections.controller';
import { SQSClient } from '@aws-sdk/client-sqs';
import {
  DASHBOARD_PROJECTIONS_QUEUE_URL,
  DASHBOARD_PROJECTIONS_SQS_CLIENT,
  DashboardProjectionEventsService,
} from './dashboard-projection-events.service';

@Module({
  imports: [CadastroInfoModule],
  controllers: [DashboardProjectionsController],
  providers: [
    {
      provide: DASHBOARD_LAMBDA_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        new LambdaClient({ region: config.get<string>('AWS_REGION') || 'us-east-1' }),
    },
    {
      provide: DASHBOARD_PROJECTIONS_FUNCTION_NAME,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        config.get<string>('DASHBOARD_PROJECTIONS_FUNCTION_NAME')?.trim() || '',
    },
    {
      provide: DASHBOARD_PROJECTIONS_SQS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        new SQSClient({ region: config.get<string>('AWS_REGION') || 'us-east-1' }),
    },
    {
      provide: DASHBOARD_PROJECTIONS_QUEUE_URL,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        config.get<string>('DASHBOARD_PROJECTIONS_QUEUE_URL')?.trim() || '',
    },
    DashboardProjectionsService,
    DashboardProjectionEventsService,
  ],
  exports: [DashboardProjectionsService, DashboardProjectionEventsService],
})
export class DashboardProjectionsModule {}
