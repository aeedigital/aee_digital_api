import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnswersController } from './answers.controller';
import { AnswersSchema } from './schemas/answers.schema';
import { ANSWER_REPOSITORY } from '../domain/repositories/repository.tokens';
import { AnswersMongoRepository } from '../infra/mongo/answers.mongo.repository';
import { AnswersAppService } from '../application/answers/answers.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Answers', schema: AnswersSchema }]),
  ],

  controllers: [AnswersController],
  providers: [
    AnswersAppService,
    {
      provide: ANSWER_REPOSITORY,
      useClass: AnswersMongoRepository,
    },
  ],
})
export class AnswersModule {}
