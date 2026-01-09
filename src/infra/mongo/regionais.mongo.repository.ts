import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  CreateRegionalInput,
  RegionalFilter,
  RegionalRepository,
  UpdateRegionalInput,
} from '../../domain/repositories/regional.repository';
import { Regional } from '../../domain/entities/regional';
import { RegionalDocument } from '../../regionais/schemas/regionais.schema';
import { CacheService } from '../../services/cache.service';
import { BaseMongoRepository } from './base.mongo.repository';
import { mapProps, omitUndefined } from '../../base/mappers/object.mapper';

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
}
