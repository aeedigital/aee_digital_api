import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LambdaClient } from '@aws-sdk/client-lambda';
import {
  DASHBOARD_LAMBDA_CLIENT,
  DASHBOARD_PROJECTIONS_FUNCTION_NAME,
  DashboardProjectionsService,
} from './dashboard-projections.service';

@Module({
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
    DashboardProjectionsService,
  ],
  exports: [DashboardProjectionsService],
})
export class DashboardProjectionsModule {}
