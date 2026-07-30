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
    const { sortByUpdatedAt = true } = filter;
    const items = await this.findAll({
      dateFrom: filter.dateFrom,
      dateTo: filter.dateTo,
    });
    const filtered = items.filter((a) => filter.centroIds.includes(a.centroId));
    return sortByUpdatedAt
      ? filtered.sort((a, b) => (b.updatedAt?.getTime() || 0) - (a.updatedAt?.getTime() || 0))
      : filtered;
  }
}
