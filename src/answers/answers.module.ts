import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { MongooseModule } from '@nestjs/mongoose';
import { AnswersService } from './answers.service';
import { CacheService } from '../services/cache.service';

import { AnswersController } from './answers.controller';

import { AnswersSchema } from './schemas/answers.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Answers', schema: AnswersSchema }]),
    CacheModule.register(), // Importe o CacheModule e registre-o aqui
  ],

  controllers: [AnswersController],
  providers: [AnswersService, CacheService],
})
export class AnswersModule {}
