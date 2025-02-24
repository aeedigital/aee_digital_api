/*
https://docs.nestjs.com/modules
*/
import { SummaryService } from './summary.service';
import { SummariesController } from './summary.controller';

import { Module } from '@nestjs/common';
import { CacheService } from '../services/cache.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Summaries, SummariesSchema } from './schemas/summaries.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Summaries.name, schema: SummariesSchema },
    ]),
  ],
  controllers: [SummariesController],
  providers: [SummaryService, CacheService],
  exports: [SummaryService]
})
export class SummaryModule {}
