import { Injectable } from '@nestjs/common';
import { Answer } from '../../domain/entities/answer';
import {
  AnswerFilter,
  AnswerRepository,
  CreateAnswerInput,
  UpdateAnswerInput,
  AnswerManyFilter,
} from '../../domain/repositories/answer.repository';
import { BaseMemoryRepository } from './base.memory.repository';

@Injectable()
export class AnswersMemoryRepository
  extends BaseMemoryRepository<Answer, CreateAnswerInput, UpdateAnswerInput, AnswerFilter>
  implements AnswerRepository
{
  async findByCentroIds(filter: AnswerManyFilter): Promise<Answer[]> {
    const items = await this.findAll({
      dateFrom: filter.dateFrom,
      dateTo: filter.dateTo,
    });
    return items
      .filter((a) => filter.centroIds.includes(a.centroId))
      .sort((a, b) => (b.updatedAt?.getTime() || 0) - (a.updatedAt?.getTime() || 0));
  }
}
