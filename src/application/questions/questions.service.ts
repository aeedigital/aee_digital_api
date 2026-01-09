import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  CreateQuestionInput,
  QuestionFilter,
  QuestionRepository,
  UpdateQuestionInput,
} from '../../domain/repositories/question.repository';
import { QuestionEntity } from '../../domain/entities/question';
import { QUESTION_REPOSITORY } from '../../domain/repositories/repository.tokens';

@Injectable()
export class QuestionsAppService {
  constructor(
    @Inject(QUESTION_REPOSITORY)
    private readonly repository: QuestionRepository,
  ) {}

  create(data: CreateQuestionInput): Promise<QuestionEntity> {
    return this.repository.create(data);
  }

  findAll(filter?: QuestionFilter): Promise<QuestionEntity[]> {
    return this.repository.findAll(filter);
  }

  async findOne(id: string): Promise<QuestionEntity> {
    const question = await this.repository.findById(id);
    if (!question) {
      throw new NotFoundException('Question not found');
    }
    return question;
  }

  update(id: string, data: UpdateQuestionInput): Promise<QuestionEntity> {
    return this.repository.update(id, data);
  }

  updateOrCreate(
    filter: Partial<QuestionFilter> & { id?: string },
    data: CreateQuestionInput,
  ): Promise<QuestionEntity> {
    return this.repository.updateOrCreate(filter, data);
  }

  delete(id: string): Promise<void> {
    return this.repository.delete(id);
  }
}
