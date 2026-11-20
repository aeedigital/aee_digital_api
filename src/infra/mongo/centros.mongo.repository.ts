import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  CentroAddress,
  CentroFilter,
  CentroRepository,
  CentroSummaryProfile,
  CreateCentroInput,
  UpdateCentroInput,
} from '../../domain/repositories/centro.repository';
import { Centro, CentroLocation, SummarySourceVersion } from '../../domain/entities/centro';
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
      TELEFONE: 'telefone',
      SITE: 'site',
      LOCALIZACAO: 'location',
      SUMMARY_SOURCE_VERSION: 'summarySourceVersion',
      },
    );
    if (core.location) {
      core.location = this.locationToDomain((doc as any).LOCALIZACAO);
    }
    if (core.summarySourceVersion) {
      const version = (doc as any).SUMMARY_SOURCE_VERSION;
      core.summarySourceVersion = {
        updatedAt: new Date(version.UPDATED_AT),
        createdAt: new Date(version.CREATED_AT),
        summaryId: version.SUMMARY_ID,
      };
    }
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
      telefone: 'TELEFONE',
      site: 'SITE',
      fields: 'fields',
      sortBy: 'sortBy',
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
      telefone: 'TELEFONE',
      site: 'SITE',
      location: 'LOCALIZACAO',
    });
    if (payload.LOCALIZACAO) {
      payload.LOCALIZACAO = this.locationToPersistence(payload.LOCALIZACAO);
    }
    return omitUndefined(payload);
  }

  async findById(id: string): Promise<Centro | null> {
    const doc = await this.model
      .findById(id)
      .select('+LOCALIZACAO.ENDERECO_HASH +LOCALIZACAO.ERRO_CODIGO')
      .lean();
    return doc ? this.toDomain(doc) : null;
  }

  async update(id: string, data: UpdateCentroInput): Promise<Centro> {
    const updated = await this.model
      .findByIdAndUpdate(id, { $set: this.toPersistence(data) }, { new: true, lean: true })
      .exec();
    if (!updated) {
      throw new NotFoundException('Centro not found');
    }
    await this.cacheService.invalidateModelCache(this.model.modelName);
    return this.toDomain(updated);
  }

  async applySummaryProfileIfNewer(
    id: string,
    sourceVersion: SummarySourceVersion,
    profile: CentroSummaryProfile,
  ): Promise<boolean> {
    const { updatedAt, createdAt, summaryId } = sourceVersion;
    const profilePersistence = omitUndefined({
      FUNCIONAMENTO: profile.funcionamento,
      ENDERECO: profile.endereco,
      CEP: profile.cep,
      BAIRRO: profile.bairro,
      CIDADE: profile.cidade,
      ESTADO: profile.estado,
      PAIS: profile.pais,
      LOCALIZACAO: profile.location
        ? this.locationToPersistence(profile.location)
        : undefined,
      TELEFONE: profile.telefone === null ? undefined : profile.telefone,
      SITE: profile.site === null ? undefined : profile.site,
    });
    const unset = omitUndefined({
      ...(profile.telefone === null ? { TELEFONE: '' } : {}),
      ...(profile.site === null ? { SITE: '' } : {}),
    });
    const update: Record<string, unknown> = {
      $set: {
        ...profilePersistence,
        SUMMARY_SOURCE_VERSION: {
          UPDATED_AT: updatedAt,
          CREATED_AT: createdAt,
          SUMMARY_ID: summaryId,
        },
      },
    };
    if (Object.keys(unset).length > 0) {
      update.$unset = unset;
    }

    const updated = await this.model
      .findOneAndUpdate(
        {
          _id: id,
          $or: [
            { SUMMARY_SOURCE_VERSION: { $exists: false } },
            { 'SUMMARY_SOURCE_VERSION.UPDATED_AT': { $lt: updatedAt } },
            {
              'SUMMARY_SOURCE_VERSION.UPDATED_AT': updatedAt,
              'SUMMARY_SOURCE_VERSION.CREATED_AT': { $lt: createdAt },
            },
            {
              'SUMMARY_SOURCE_VERSION.UPDATED_AT': updatedAt,
              'SUMMARY_SOURCE_VERSION.CREATED_AT': createdAt,
              'SUMMARY_SOURCE_VERSION.SUMMARY_ID': { $lt: summaryId },
            },
          ],
        },
        update,
        { new: true, lean: true },
      )
      .exec();

    if (!updated) {
      const existing = await this.model.findById(id).select('_id').lean();
      if (!existing) {
        throw new NotFoundException('Centro not found');
      }
      return false;
    }

    await this.cacheService.invalidateModelCache(this.model.modelName);
    return true;
  }

  async saveLocation(
    id: string,
    expectedAddress: CentroAddress,
    location: CentroLocation,
  ): Promise<Centro> {
    const updated = await this.model
      .findOneAndUpdate(
        {
          _id: id,
          ENDERECO: expectedAddress.endereco,
          CEP: expectedAddress.cep,
          BAIRRO: expectedAddress.bairro,
          CIDADE: expectedAddress.cidade,
          ESTADO: expectedAddress.estado,
          PAIS: expectedAddress.pais,
        },
        { $set: { LOCALIZACAO: this.locationToPersistence(location) } },
        { new: true, lean: true },
      )
      .exec();

    if (!updated) {
      throw new ConflictException(
        'O centro não existe ou seu endereço foi alterado durante a atualização',
      );
    }
    await this.cacheService.invalidateModelCache(this.model.modelName);
    return this.toDomain(updated);
  }

  private locationToDomain(location: any): CentroLocation | undefined {
    if (!location) return undefined;
    return omitUndefined({
      latitude: location.PONTO?.coordinates?.[1],
      longitude: location.PONTO?.coordinates?.[0],
      status: location.STATUS,
      precision: location.PRECISAO,
      confidence: location.CONFIANCA,
      origin: location.ORIGEM,
      placeId: location.PLACE_ID,
      formattedAddress: location.ENDERECO_FORMATADO,
      updatedAt: location.ATUALIZADA_EM
        ? new Date(location.ATUALIZADA_EM)
        : undefined,
      addressHash: location.ENDERECO_HASH,
      errorCode: location.ERRO_CODIGO,
    }) as CentroLocation;
  }

  private locationToPersistence(location: CentroLocation): Record<string, any> {
    const hasPoint =
      location.latitude !== undefined && location.longitude !== undefined;
    return omitUndefined({
      ...(hasPoint
        ? {
            PONTO: {
              type: 'Point',
              coordinates: [location.longitude, location.latitude],
            },
          }
        : {}),
      STATUS: location.status,
      PRECISAO: location.precision,
      CONFIANCA: location.confidence,
      ORIGEM: location.origin,
      PLACE_ID: location.placeId,
      ENDERECO_FORMATADO: location.formattedAddress,
      ATUALIZADA_EM: location.updatedAt,
      ENDERECO_HASH: location.addressHash,
      ERRO_CODIGO: location.errorCode,
    });
  }
}
