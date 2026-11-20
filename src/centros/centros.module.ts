import { Module } from '@nestjs/common';
import { CacheService } from '../services/cache.service';
import { CentrosController } from './centros.controller';
import { SummaryModule } from '../summary/summary.module';
import { CentrosAppService } from '../application/centros/centros.service';
import { PersistenceModule } from '../infra/persistence/persistence.module';
import { LocationUpdateTokenGuard } from './location/location-update-token.guard';
import { AnswersModule } from '../answers/answers.module';

@Module({
  imports: [SummaryModule, AnswersModule, PersistenceModule.forRoot()],
  controllers: [CentrosController],
  providers: [CentrosAppService, CacheService, LocationUpdateTokenGuard],
  exports: [CentrosAppService],
})
export class CentrosModule {}
