/*
https://docs.nestjs.com/modules
*/
import { SummariesController } from './summary.controller';

import { Module } from '@nestjs/common';
import { CacheService } from '../services/cache.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Summaries, SummariesSchema } from './schemas/summaries.schema';
import { SummariesMongoRepository } from '../infra/mongo/summaries.mongo.repository';
import { SUMMARY_REPOSITORY } from '../domain/repositories/repository.tokens';
import { SummaryAppService } from '../application/summary/summary.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Summaries.name, schema: SummariesSchema },
    ]),
  ],
  controllers: [SummariesController],
  providers: [
    SummaryAppService,
    CacheService,
    {
      provide: SUMMARY_REPOSITORY,
      useClass: SummariesMongoRepository,
    },
  ],
  exports: [SummaryAppService],
})
export class SummaryModule {}
