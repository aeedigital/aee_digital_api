import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  CreateSummaryInput,
  SummaryFilter,
  SummaryRepository,
  UpdateSummaryInput,
} from '../../domain/repositories/summary.repository';
import { Summary } from '../../domain/entities/summary';
import { SummariesDocument, Summaries } from '../../summary/schemas/summaries.schema';
import { CacheService } from '../../services/cache.service';
import { BaseMongoRepository } from './base.mongo.repository';
import { extractId } from '../../base/mappers/mongo-id.mapper';
import { mapProps, omitUndefined } from '../../base/mappers/object.mapper';

@Injectable()
export class SummariesMongoRepository
  extends BaseMongoRepository<
    Summary,
    CreateSummaryInput,
    UpdateSummaryInput,
    SummaryFilter
  >
  implements SummaryRepository
{
  constructor(
    @InjectModel(Summaries.name)
    protected readonly model: Model<SummariesDocument>,
    protected readonly cacheService: CacheService,
  ) {
    super(model, cacheService);
  }

  protected toDomain(doc: any): Summary {
    const mapQuestion = (item: any) => ({
      answer: item.ANSWER,
      questionId: extractId(item.QUESTION),
    });

    return {
      id: doc._id?.toString(),
      formId: extractId(doc.FORM_ID),
      centroId: extractId(doc.CENTRO_ID),
      questions: (doc.QUESTIONS || []).map(mapQuestion),
      validatedByCoordAt: doc.validatedByCoordAt
        ? new Date(doc.validatedByCoordAt)
        : undefined,
      createdAt: doc.createdAt ? new Date(doc.createdAt) : undefined,
      updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : undefined,
    };
  }

  protected buildFilter(filter?: SummaryFilter): Record<string, any> {
    return mapProps(filter as any, {
      formId: 'FORM_ID',
      centroId: 'CENTRO_ID',
      fields: 'fields',
    });
  }

  protected toPersistence(
    data: CreateSummaryInput | UpdateSummaryInput,
  ): Record<string, any> {
    const payload = mapProps(data as any, {
      formId: 'FORM_ID',
      centroId: 'CENTRO_ID',
      validatedByCoordAt: 'validatedByCoordAt',
    });
    const questions = data.questions?.map((q) => ({
      ANSWER: q.answer,
      QUESTION: q.questionId,
    }));
    return omitUndefined({
      ...payload,
      QUESTIONS: questions,
    });
  }

  async update(id: string, data: UpdateSummaryInput): Promise<Summary> {
    const updated = await this.model
      .findByIdAndUpdate(id, { $set: this.toPersistence(data) }, { new: true, lean: true })
      .exec();
    if (!updated) {
      throw new NotFoundException('Summary not found');
    }
    return this.toDomain(updated);
  }
}
