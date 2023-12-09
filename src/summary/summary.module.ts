/*
https://docs.nestjs.com/modules
*/
import { SummaryService } from './summary.service';
import { SummariesController } from './summary.controller';

import { CacheModule, Module } from '@nestjs/common';
import { CacheService } from '../services/cache.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Summaries, SummariesSchema } from './schemas/summaries.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Summaries.name, schema: SummariesSchema },
    ]),
    CacheModule.register(), // Importe o CacheModule e registre-o aqui
  ],
  controllers: [SummariesController],
  providers: [SummaryService, CacheService],
})
export class SummaryModule {}
