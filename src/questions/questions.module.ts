import { Module } from '@nestjs/common';
import { CacheService } from '../services/cache.service';

import { QuestionsController } from './questions.controller';

import { QUESTION_REPOSITORY } from '../domain/repositories/repository.tokens';
import { QuestionsAppService } from '../application/questions/questions.service';
import { PersistenceModule } from '../infra/persistence/persistence.module';

@Module({
  imports: [PersistenceModule.forRoot()],

  controllers: [QuestionsController],
  providers: [
    QuestionsAppService,
    CacheService,
    // repository provided by PersistenceModule
  ],
})
export class QuestionsModule {}
