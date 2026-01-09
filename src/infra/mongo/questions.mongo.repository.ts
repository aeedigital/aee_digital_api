import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  CreateQuestionInput,
  QuestionFilter,
  QuestionRepository,
  UpdateQuestionInput,
} from '../../domain/repositories/question.repository';
import { QuestionEntity } from '../../domain/entities/question';
import { QuestionsDocument } from '../../questions/schemas/questions.schema';
import { CacheService } from '../../services/cache.service';
import { BaseMongoRepository } from './base.mongo.repository';
import { mapProps, omitUndefined } from '../../base/mappers/object.mapper';

@Injectable()
export class QuestionsMongoRepository
  extends BaseMongoRepository<
    QuestionEntity,
    CreateQuestionInput,
    UpdateQuestionInput,
    QuestionFilter
  >
  implements QuestionRepository
{
  constructor(
    @InjectModel('Questions') protected readonly model: Model<QuestionsDocument>,
    protected readonly cacheService: CacheService,
  ) {
    super(model, cacheService);
  }

  protected toDomain(doc: any): QuestionEntity {
    const core: Omit<QuestionEntity, 'id' | 'presetValues'> = mapProps(doc, {
      QUESTION: 'question',
      ANSWER_TYPE: 'answerType',
      IS_REQUIRED: 'isRequired',
      IS_MULTIPLE: 'isMultiple',
      ROLE: 'role',
    });
    return {
      id: doc._id?.toString(),
      ...core,
      presetValues: doc.PRESET_VALUES || [],
    };
  }

  protected buildFilter(filter?: QuestionFilter): Record<string, any> {
    return mapProps(filter as any, {
      question: 'QUESTION',
      answerType: 'ANSWER_TYPE',
      isRequired: 'IS_REQUIRED',
      isMultiple: 'IS_MULTIPLE',
      role: 'ROLE',
      fields: 'fields',
    });
  }

  protected toPersistence(
    data: CreateQuestionInput | UpdateQuestionInput,
  ): Record<string, any> {
    const payload = mapProps(data as any, {
      question: 'QUESTION',
      answerType: 'ANSWER_TYPE',
      isRequired: 'IS_REQUIRED',
      isMultiple: 'IS_MULTIPLE',
      presetValues: 'PRESET_VALUES',
      role: 'ROLE',
    });
    return omitUndefined(payload);
  }

  async update(id: string, data: UpdateQuestionInput): Promise<QuestionEntity> {
    const updated = await this.model
      .findByIdAndUpdate(id, { $set: this.toPersistence(data) }, { new: true, lean: true })
      .exec();
    if (!updated) {
      throw new NotFoundException('Question not found');
    }
    return this.toDomain(updated);
  }
}
