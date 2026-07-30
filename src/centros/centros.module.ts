import { Module } from '@nestjs/common';
import { CacheService } from '../services/cache.service';

import { CentrosController } from './centros.controller';

import { Centro, CentroSchema } from './schemas/centro.schema';
import { SummaryModule } from '../summary/summary.module';
import { CENTRO_REPOSITORY } from '../domain/repositories/repository.tokens';
import { CentrosAppService } from '../application/centros/centros.service';
import { PersistenceModule } from '../infra/persistence/persistence.module';

@Module({
  imports: [
    SummaryModule,
    PersistenceModule.forRoot(),
  ],

  controllers: [CentrosController],
  providers: [
    CentrosAppService,
    CacheService,
    // repository provided by PersistenceModule
  ],
  exports: [CentrosAppService],
})
export class CentrosModule {}
