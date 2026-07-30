import { Module } from '@nestjs/common';
import { AnswersController } from './answers.controller';
import { AnswersSchema } from './schemas/answers.schema';
import { ANSWER_REPOSITORY } from '../domain/repositories/repository.tokens';
import { AnswersAppService } from '../application/answers/answers.service';
import { PersistenceModule } from '../infra/persistence/persistence.module';

@Module({
  imports: [PersistenceModule.forRoot()],

  controllers: [AnswersController],
  providers: [AnswersAppService],
  exports: [AnswersAppService],
})
export class AnswersModule {}
