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
    return {
      id: doc._id?.toString(),
      question: doc.QUESTION,
      answerType: doc.ANSWER_TYPE,
      isRequired: doc.IS_REQUIRED,
      isMultiple: doc.IS_MULTIPLE,
      presetValues: doc.PRESET_VALUES || [],
      role: doc.ROLE,
    };
  }

  protected buildFilter(filter?: QuestionFilter): Record<string, any> {
    const query: Record<string, any> = {};
    if (!filter) return query;
    if ((filter as any).question) query['QUESTION'] = (filter as any).question;
    if ((filter as any).answerType) query['ANSWER_TYPE'] = (filter as any).answerType;
    if ((filter as any).isRequired !== undefined)
      query['IS_REQUIRED'] = (filter as any).isRequired;
    if ((filter as any).isMultiple !== undefined)
      query['IS_MULTIPLE'] = (filter as any).isMultiple;
    if ((filter as any).role) query['ROLE'] = (filter as any).role;
    if ((filter as any).fields) query['fields'] = (filter as any).fields;
    return query;
  }

  protected toPersistence(
    data: CreateQuestionInput | UpdateQuestionInput,
  ): Record<string, any> {
    const payload: Record<string, any> = {
      QUESTION: data.question,
      ANSWER_TYPE: data.answerType,
      IS_REQUIRED: data.isRequired,
      IS_MULTIPLE: data.isMultiple,
      PRESET_VALUES: data.presetValues,
      ROLE: data.role,
    };
    Object.keys(payload).forEach(
      (key) => payload[key] === undefined && delete payload[key],
    );
    return payload;
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
