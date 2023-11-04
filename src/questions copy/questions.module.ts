import { CacheModule, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QuestionsService } from './questions.service';
import { CacheService } from '../services/cache.service';

import { QuestionsController } from './questions.controller';

import { QuestionsSchema } from './schemas/questions.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Questions', schema: QuestionsSchema }]),
    CacheModule.register(), // Importe o CacheModule e registre-o aqui
  ],

  controllers: [QuestionsController],
  providers: [QuestionsService, CacheService],
})
export class QuestionssModule {}
