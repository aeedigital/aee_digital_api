import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CacheService } from '../services/cache.service';

import { QuestionsController } from './questions.controller';

import { QuestionsSchema } from './schemas/questions.schema';
import { QuestionsMongoRepository } from '../infra/mongo/questions.mongo.repository';
import { QUESTION_REPOSITORY } from './questions.tokens';
import { QuestionsAppService } from '../application/questions/questions.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Questions', schema: QuestionsSchema }]),
  ],

  controllers: [QuestionsController],
  providers: [
    QuestionsAppService,
    CacheService,
    {
      provide: QUESTION_REPOSITORY,
      useClass: QuestionsMongoRepository,
    },
  ],
})
export class QuestionsModule {}
