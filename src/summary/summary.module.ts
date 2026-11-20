/*
https://docs.nestjs.com/modules
*/
import { SummariesController } from './summary.controller';

import { Module } from '@nestjs/common';
import { CacheService } from '../services/cache.service';
import { SUMMARY_REPOSITORY } from '../domain/repositories/repository.tokens';
import { SummaryAppService } from '../application/summary/summary.service';
import { PersistenceModule } from '../infra/persistence/persistence.module';
import { CadastroInfoModule } from '../cadastro-info/cadastro-info.module';
import { DashboardProjectionsModule } from '../dashboard-projections/dashboard-projections.module';

@Module({
  imports: [
    PersistenceModule.forRoot(),
    CadastroInfoModule,
    DashboardProjectionsModule,
  ],
  controllers: [SummariesController],
  providers: [
    SummaryAppService,
    CacheService,
    // repository provided by PersistenceModule
  ],
  exports: [SummaryAppService],
})
export class SummaryModule {}
