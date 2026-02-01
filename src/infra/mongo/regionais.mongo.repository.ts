import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  CreateRegionalInput,
  RegionalFilter,
  RegionalOverviewFilter,
  RegionalOverviewItem,
  RegionalRepository,
  UpdateRegionalInput,
} from '../../domain/repositories/regional.repository';
import { Regional } from '../../domain/entities/regional';
import { RegionalDocument } from '../../regionais/schemas/regionais.schema';
import { CacheService } from '../../services/cache.service';
import { BaseMongoRepository } from './base.mongo.repository';
import { mapProps, omitUndefined } from '../../base/mappers/object.mapper';
import { CentroDocument } from '../../centros/schemas/centro.schema';
import { SummariesDocument } from '../../summary/schemas/summaries.schema';

@Injectable()
export class RegionaisMongoRepository
  extends BaseMongoRepository<
    Regional,
    CreateRegionalInput,
    UpdateRegionalInput,
    RegionalFilter
  >
  implements RegionalRepository
{
  constructor(
    @InjectModel('Regional') protected readonly model: Model<RegionalDocument>,
    @InjectModel('Centro') private readonly centroModel: Model<CentroDocument>,
    @InjectModel('Summaries') private readonly summaryModel: Model<SummariesDocument>,
    protected readonly cacheService: CacheService,
  ) {
    super(model, cacheService);
  }

  protected toDomain(doc: any): Regional {
    const core: Omit<Regional, 'id'> = mapProps(doc, {
      NOME_REGIONAL: 'nomeRegional',
      PAIS: 'pais',
      COORDENADOR_ID: 'coordenadorId',
    });
    return {
      id: doc._id?.toString(),
      ...core,
    };
  }

  protected buildFilter(filter?: RegionalFilter): Record<string, any> {
    return mapProps(filter as any, {
      nomeRegional: 'NOME_REGIONAL',
      pais: 'PAIS',
      coordenadorId: 'COORDENADOR_ID',
      fields: 'fields',
    });
  }

  protected toPersistence(
    data: CreateRegionalInput | UpdateRegionalInput,
  ): Record<string, any> {
    const payload = mapProps(data as any, {
      nomeRegional: 'NOME_REGIONAL',
      pais: 'PAIS',
      coordenadorId: 'COORDENADOR_ID',
    });
    return omitUndefined(payload);
  }

  async update(id: string, data: UpdateRegionalInput): Promise<Regional> {
    const updated = await this.model
      .findByIdAndUpdate(id, { $set: this.toPersistence(data) }, { new: true, lean: true })
      .exec();
    if (!updated) {
      throw new NotFoundException('Regional not found');
    }
    return this.toDomain(updated);
  }

  async overview(filter: RegionalOverviewFilter): Promise<RegionalOverviewItem[]> {
    const dateMatch: any = {};
    if (filter.dateFrom) dateMatch['$gte'] = filter.dateFrom;
    if (filter.dateTo) dateMatch['$lte'] = filter.dateTo;
    const hasDate = Object.keys(dateMatch).length > 0;

    const pipeline: any[] = [
      {
        $lookup: {
          from: 'centros',
          let: { regionalId: { $toString: '$_id' } },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$REGIONAL', '$$regionalId'] },
              },
            },
            { $project: { _id: 1 } },
          ],
          as: 'centros',
        },
      },
      { $addFields: { centrosCount: { $size: '$centros' } } },
      {
        $lookup: {
          from: 'summaries',
          let: {
            centroIds: {
              $map: {
                input: '$centros._id',
                as: 'c',
                in: { $toString: '$$c' },
              },
            },
          },
          pipeline: [
            {
              $match: {
                $expr: { $in: ['$CENTRO_ID', '$$centroIds'] },
                ...(hasDate ? { createdAt: dateMatch } : {}),
              },
            },
            // conta distintos por centro
            { $group: { _id: '$CENTRO_ID' } },
            { $count: 'total' },
          ],
          as: 'finalizados',
        },
      },
      {
        $addFields: {
          finalizadosCount: {
            $ifNull: [{ $first: '$finalizados.total' }, 0],
          },
        },
      },
      {
        $project: {
          _id: 1,
          NOME_REGIONAL: 1,
          PAIS: 1,
          centrosCount: 1,
          finalizadosCount: 1,
        },
      },
      {
        $sort: { NOME_REGIONAL: 1 },
      },
    ];

    const result = await this.model.aggregate(pipeline).exec();
    return result.map((doc: any) => ({
      id: doc._id?.toString(),
      nomeRegional: doc.NOME_REGIONAL,
      pais: doc.PAIS,
      centrosCount: doc.centrosCount || 0,
      finalizadosCount: doc.finalizadosCount || 0,
    }));
  }
}
