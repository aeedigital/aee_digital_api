import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  CentroFilter,
  CentroRepository,
  CreateCentroInput,
  UpdateCentroInput,
} from '../../domain/repositories/centro.repository';
import { Centro } from '../../domain/entities/centro';
import { CentroDocument } from '../../centros/schemas/centro.schema';
import { CacheService } from '../../services/cache.service';
import { BaseMongoRepository } from './base.mongo.repository';
import { mapProps, omitUndefined } from '../../base/mappers/object.mapper';

@Injectable()
export class CentrosMongoRepository
  extends BaseMongoRepository<Centro, CreateCentroInput, UpdateCentroInput, CentroFilter>
  implements CentroRepository
{
  constructor(
    @InjectModel('Centro') protected readonly model: Model<CentroDocument>,
    protected readonly cacheService: CacheService,
  ) {
    super(model, cacheService);
  }

  protected toDomain(doc: any): Centro {
    const core: Omit<Centro, 'id' | 'createdAt' | 'updatedAt'> = mapProps(
      doc,
      {
      FUNCIONAMENTO: 'funcionamento',
      NOME_CENTRO: 'nomeCentro',
      NOME_CURTO: 'nomeCurto',
      CNPJ_CENTRO: 'cnpjCentro',
      DATA_FUNDACAO: 'dataFundacao',
      REGIONAL: 'regional',
      ENDERECO: 'endereco',
      CEP: 'cep',
      BAIRRO: 'bairro',
      CIDADE: 'cidade',
      ESTADO: 'estado',
      PAIS: 'pais',
      },
    );
    return {
      id: doc._id?.toString(),
      ...core,
      createdAt: doc.createdAt ? new Date(doc.createdAt) : undefined,
      updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : undefined,
    };
  }

  protected buildFilter(filter?: CentroFilter): Record<string, any> {
    return mapProps(filter as any, {
      funcionamento: 'FUNCIONAMENTO',
      nomeCentro: 'NOME_CENTRO',
      nomeCurto: 'NOME_CURTO',
      cnpjCentro: 'CNPJ_CENTRO',
      dataFundacao: 'DATA_FUNDACAO',
      regional: 'REGIONAL',
      endereco: 'ENDERECO',
      cep: 'CEP',
      bairro: 'BAIRRO',
      cidade: 'CIDADE',
      estado: 'ESTADO',
      pais: 'PAIS',
      fields: 'fields',
    });
  }

  protected toPersistence(
    data: CreateCentroInput | UpdateCentroInput,
  ): Record<string, any> {
    const payload = mapProps(data as any, {
      funcionamento: 'FUNCIONAMENTO',
      nomeCentro: 'NOME_CENTRO',
      nomeCurto: 'NOME_CURTO',
      cnpjCentro: 'CNPJ_CENTRO',
      dataFundacao: 'DATA_FUNDACAO',
      regional: 'REGIONAL',
      endereco: 'ENDERECO',
      cep: 'CEP',
      bairro: 'BAIRRO',
      cidade: 'CIDADE',
      estado: 'ESTADO',
      pais: 'PAIS',
    });
    return omitUndefined(payload);
  }

  async update(id: string, data: UpdateCentroInput): Promise<Centro> {
    const updated = await this.model
      .findByIdAndUpdate(id, { $set: this.toPersistence(data) }, { new: true, lean: true })
      .exec();
    if (!updated) {
      throw new NotFoundException('Centro not found');
    }
    return this.toDomain(updated);
  }
}
