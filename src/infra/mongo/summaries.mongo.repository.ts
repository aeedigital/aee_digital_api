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
      questionId:
        item.QUESTION?._id?.toString() ??
        item.QUESTION?.toString?.() ??
        item.QUESTION,
    });

    return {
      id: doc._id?.toString(),
      formId:
        doc.FORM_ID?._id?.toString() ??
        doc.FORM_ID?.toString?.() ??
        doc.FORM_ID,
      centroId:
        doc.CENTRO_ID?._id?.toString() ??
        doc.CENTRO_ID?.toString?.() ??
        doc.CENTRO_ID,
      questions: (doc.QUESTIONS || []).map(mapQuestion),
      validatedByCoordAt: doc.validatedByCoordAt
        ? new Date(doc.validatedByCoordAt)
        : undefined,
      createdAt: doc.createdAt ? new Date(doc.createdAt) : undefined,
      updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : undefined,
    };
  }

  protected buildFilter(filter?: SummaryFilter): Record<string, any> {
    const query: Record<string, any> = {};
    if (!filter) return query;
    if ((filter as any).formId) query['FORM_ID'] = (filter as any).formId;
    if ((filter as any).centroId) query['CENTRO_ID'] = (filter as any).centroId;
    if ((filter as any).fields) query['fields'] = (filter as any).fields;
    return query;
  }

  protected toPersistence(
    data: CreateSummaryInput | UpdateSummaryInput,
  ): Record<string, any> {
    const payload: Record<string, any> = {
      FORM_ID: data.formId,
      CENTRO_ID: data.centroId,
      QUESTIONS: data.questions?.map((q) => ({
        ANSWER: q.answer,
        QUESTION: q.questionId,
      })),
      validatedByCoordAt: data.validatedByCoordAt,
    };
    Object.keys(payload).forEach(
      (key) => payload[key] === undefined && delete payload[key],
    );
    return payload;
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
