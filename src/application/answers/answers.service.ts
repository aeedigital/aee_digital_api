import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  AnswerFilter,
  AnswerRepository,
  CreateAnswerInput,
  UpdateAnswerInput,
} from '../../domain/repositories/answer.repository';
import { Answer } from '../../domain/entities/answer';
import { ANSWER_REPOSITORY } from '../../domain/repositories/repository.tokens';

@Injectable()
export class AnswersAppService {
  constructor(
    @Inject(ANSWER_REPOSITORY)
    private readonly repository: AnswerRepository,
  ) {}

  create(data: CreateAnswerInput): Promise<Answer> {
    return this.repository.create(data);
  }

  findAll(filter?: AnswerFilter): Promise<Answer[]> {
    return this.repository.findAll(filter);
  }

  async findOne(id: string): Promise<Answer> {
    const item = await this.repository.findById(id);
    if (!item) {
      throw new NotFoundException('Answer not found');
    }
    return item;
  }

  async update(id: string, data: UpdateAnswerInput): Promise<Answer> {
    return this.repository.update(id, data);
  }

  updateOrCreate(
    filter: Partial<AnswerFilter> & { id?: string },
    data: CreateAnswerInput,
  ): Promise<Answer> {
    return this.repository.updateOrCreate(filter, data);
  }

  delete(id: string): Promise<void> {
    return this.repository.delete(id);
  }

  findByCentroIds(filter: any): Promise<Answer[]> {
    return this.repository.findByCentroIds(filter);
  }
}
