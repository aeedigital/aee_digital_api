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
    return {
      id: doc._id?.toString(),
      funcionamento: doc.FUNCIONAMENTO,
      nomeCentro: doc.NOME_CENTRO,
      nomeCurto: doc.NOME_CURTO,
      cnpjCentro: doc.CNPJ_CENTRO,
      dataFundacao: doc.DATA_FUNDACAO,
      regional: doc.REGIONAL,
      endereco: doc.ENDERECO,
      cep: doc.CEP,
      bairro: doc.BAIRRO,
      cidade: doc.CIDADE,
      estado: doc.ESTADO,
      pais: doc.PAIS,
      createdAt: doc.createdAt ? new Date(doc.createdAt) : undefined,
      updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : undefined,
    };
  }

  protected buildFilter(filter?: CentroFilter): Record<string, any> {
    const query: Record<string, any> = {};
    if (!filter) return query;
    if ((filter as any).funcionamento) query['FUNCIONAMENTO'] = (filter as any).funcionamento;
    if ((filter as any).nomeCentro) query['NOME_CENTRO'] = (filter as any).nomeCentro;
    if ((filter as any).nomeCurto) query['NOME_CURTO'] = (filter as any).nomeCurto;
    if ((filter as any).cnpjCentro) query['CNPJ_CENTRO'] = (filter as any).cnpjCentro;
    if ((filter as any).dataFundacao) query['DATA_FUNDACAO'] = (filter as any).dataFundacao;
    if ((filter as any).regional) query['REGIONAL'] = (filter as any).regional;
    if ((filter as any).endereco) query['ENDERECO'] = (filter as any).endereco;
    if ((filter as any).cep) query['CEP'] = (filter as any).cep;
    if ((filter as any).bairro) query['BAIRRO'] = (filter as any).bairro;
    if ((filter as any).cidade) query['CIDADE'] = (filter as any).cidade;
    if ((filter as any).estado) query['ESTADO'] = (filter as any).estado;
    if ((filter as any).pais) query['PAIS'] = (filter as any).pais;
    if ((filter as any).fields) query['fields'] = (filter as any).fields;
    return query;
  }

  protected toPersistence(
    data: CreateCentroInput | UpdateCentroInput,
  ): Record<string, any> {
    const payload: Record<string, any> = {
      FUNCIONAMENTO: data.funcionamento,
      NOME_CENTRO: data.nomeCentro,
      NOME_CURTO: data.nomeCurto,
      CNPJ_CENTRO: data.cnpjCentro,
      DATA_FUNDACAO: data.dataFundacao,
      REGIONAL: data.regional,
      ENDERECO: data.endereco,
      CEP: data.cep,
      BAIRRO: data.bairro,
      CIDADE: data.cidade,
      ESTADO: data.estado,
      PAIS: data.pais,
    };
    Object.keys(payload).forEach(
      (key) => payload[key] === undefined && delete payload[key],
    );
    return payload;
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
