import { Injectable } from '@nestjs/common';
import { QuestionEntity } from '../../domain/entities/question';
import {
  CreateQuestionInput,
  QuestionFilter,
  QuestionRepository,
  UpdateQuestionInput,
} from '../../domain/repositories/question.repository';
import { BaseMemoryRepository } from './base.memory.repository';

@Injectable()
export class QuestionsMemoryRepository
  extends BaseMemoryRepository<
    QuestionEntity,
    CreateQuestionInput,
    UpdateQuestionInput,
    QuestionFilter
  >
  implements QuestionRepository
{}
