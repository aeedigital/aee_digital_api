import { Module } from '@nestjs/common';
import { CacheService } from '../services/cache.service';

import { RegionaisController } from './regionais.controller';

import { CentrosModule } from '../centros/centros.module';
import { SummaryModule } from '../summary/summary.module';
import { REGIONAL_REPOSITORY } from '../domain/repositories/repository.tokens';
import { RegionaisAppService } from '../application/regionais/regionais.service';
import { PersistenceModule } from '../infra/persistence/persistence.module';

@Module({
  imports: [
    CentrosModule,
    SummaryModule,
    PersistenceModule.forRoot(),
  ],

  controllers: [RegionaisController],
  providers: [
    RegionaisAppService,
    CacheService,
    // repository provided by PersistenceModule
  ],
})
export class RegionaisModule {}
