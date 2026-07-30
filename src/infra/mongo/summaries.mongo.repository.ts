import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  CreateSummaryInput,
  SummaryFilter,
  SummaryRepository,
  SummaryStatsParams,
  SummaryStatsResult,
  SummaryManyFilter,
  UpdateSummaryInput,
} from '../../domain/repositories/summary.repository';
import { Summary } from '../../domain/entities/summary';
import { SummariesDocument, Summaries } from '../../summary/schemas/summaries.schema';
import { CacheService } from '../../services/cache.service';
import { BaseMongoRepository } from './base.mongo.repository';
import { extractId } from '../../base/mappers/mongo-id.mapper';
import { mapProps, omitUndefined } from '../../base/mappers/object.mapper';
import { CentroDocument } from '../../centros/schemas/centro.schema';

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
    @InjectModel('Centro')
    private readonly centroModel: Model<CentroDocument>,
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
    const base = mapProps(filter as any, {
      formId: 'FORM_ID',
      centroId: 'CENTRO_ID',
    });
    if (filter?.dateFrom || filter?.dateTo) {
      base['createdAt'] = {};
      if (filter.dateFrom) base['createdAt']['$gte'] = filter.dateFrom;
      if (filter.dateTo) base['createdAt']['$lte'] = filter.dateTo;
    }
    return base;
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

  async findAll(filter?: SummaryFilter): Promise<Summary[]> {
    const { fields, sort, skip, limit, ...rest } = filter || {};
    const query = this.model.find(this.buildFilter(rest)).lean();
    if (fields) {
      query.select(fields.split(',').join(' '));
    }
    if (sort) {
      query.sort(sort);
    } else {
      query.sort({ updatedAt: -1 });
    }
    if (skip) query.skip(skip);
    if (limit) query.limit(limit);
    const docs = await query.exec();
    return docs.map((doc) => this.toDomain(doc));
  }

  async stats(params: SummaryStatsParams): Promise<SummaryStatsResult> {
    const { dateFrom, dateTo } = params;
    const match: any = {
      createdAt: { $gte: dateFrom, $lte: dateTo },
    };

    const events = await this.model
      .aggregate([
        { $match: match },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'UTC' },
            },
            total: { $sum: 1 },
            centros: { $addToSet: '$CENTRO_ID' },
          },
        },
      ])
      .exec();

    const eventsByDay = events.reduce((acc, cur) => {
      acc[cur._id] = cur.total;
      return acc;
    }, {} as Record<string, number>);

    const respondedCentersSet = new Set<string>();
    events.forEach((e) => (e.centros || []).forEach((c) => respondedCentersSet.add(String(c))));

    const totalCentros = await this.centroModel.countDocuments().exec();

    return {
      eventsByDay,
      respondedCount: respondedCentersSet.size,
      totalCentros,
    };
  }

  async findByCentroIds(filter: SummaryManyFilter): Promise<Summary[]> {
    const { centroIds, dateFrom, dateTo, fields, sort } = filter;
    const query: any = {
      CENTRO_ID: { $in: centroIds },
    };
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt['$gte'] = dateFrom;
      if (dateTo) query.createdAt['$lte'] = dateTo;
    }
    const q = this.model.find(query).lean();
    if (fields) q.select(fields.split(',').join(' '));
    q.sort(sort || { updatedAt: -1 });
    const docs = await q.exec();
    return docs.map((doc) => this.toDomain(doc));
  }

  async findLatestByCentroIds(filter: SummaryManyFilter): Promise<Summary[]> {
    const { centroIds, dateFrom, dateTo, fields } = filter;
    if (!centroIds.length) return [];

    const match: any = { CENTRO_ID: { $in: centroIds } };
    if (dateFrom || dateTo) {
      match.createdAt = {};
      if (dateFrom) match.createdAt['$gte'] = dateFrom;
      if (dateTo) match.createdAt['$lte'] = dateTo;
    }

    const pipeline: any[] = [
      { $match: match },
      { $sort: { updatedAt: -1, createdAt: -1 } },
      {
        $group: {
          _id: '$CENTRO_ID',
          doc: { $first: '$$ROOT' },
        },
      },
      { $replaceRoot: { newRoot: '$doc' } },
    ];

    if (fields) {
      const projection = fields.split(',').reduce(
        (acc, field) => {
          acc[field.trim()] = 1;
          return acc;
        },
        { _id: 1 } as Record<string, 1>,
      );
      pipeline.push({ $project: projection });
    }

    const docs = await this.model.aggregate(pipeline).exec();
    return docs.map((doc: any) => this.toDomain(doc));
  }
}
