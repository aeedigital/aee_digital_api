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
    return {
      id: doc._id?.toString(),
      nomeRegional: doc.NOME_REGIONAL,
      pais: doc.PAIS,
      coordenadorId: doc.COORDENADOR_ID,
    };
  }

  protected buildFilter(filter?: RegionalFilter): Record<string, any> {
    const query: Record<string, any> = {};
    if (!filter) return query;
    if ((filter as any).nomeRegional) query['NOME_REGIONAL'] = (filter as any).nomeRegional;
    if ((filter as any).pais) query['PAIS'] = (filter as any).pais;
    if ((filter as any).coordenadorId) query['COORDENADOR_ID'] = (filter as any).coordenadorId;
    if ((filter as any).fields) query['fields'] = (filter as any).fields;
    return query;
  }

  protected toPersistence(
    data: CreateRegionalInput | UpdateRegionalInput,
  ): Record<string, any> {
    const payload: Record<string, any> = {
      NOME_REGIONAL: data.nomeRegional,
      PAIS: data.pais,
      COORDENADOR_ID: data.coordenadorId,
    };
    Object.keys(payload).forEach(
      (key) => payload[key] === undefined && delete payload[key],
    );
    return payload;
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
