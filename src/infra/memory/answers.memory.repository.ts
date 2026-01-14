import { Injectable } from '@nestjs/common';
import { Answer } from '../../domain/entities/answer';
import {
  AnswerFilter,
  AnswerRepository,
  CreateAnswerInput,
  UpdateAnswerInput,
} from '../../domain/repositories/answer.repository';
import { BaseMemoryRepository } from './base.memory.repository';

@Injectable()
export class AnswersMemoryRepository
  extends BaseMemoryRepository<Answer, CreateAnswerInput, UpdateAnswerInput, AnswerFilter>
  implements AnswerRepository
{}
