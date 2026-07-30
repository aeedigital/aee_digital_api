import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CacheService } from '../../services/cache.service';
import { BaseMongoRepository } from './base.mongo.repository';
import { extractId } from '../../base/mappers/mongo-id.mapper';
import { mapProps } from '../../base/mappers/object.mapper';
import { CadastroInfo } from '../../domain/entities/cadastro-info';
import {
  CadastroInfoFilter,
  CadastroInfoRepository,
  CreateCadastroInfoInput,
  UpdateCadastroInfoInput,
} from '../../domain/repositories/cadastro-info.repository';
import {
  CadastroInfoDocument,
  CadastroInfoSchemaClass,
} from '../../cadastro-info/schemas/cadastro-info.schema';

@Injectable()
export class CadastroInfoMongoRepository
  extends BaseMongoRepository<
    CadastroInfo,
    CreateCadastroInfoInput,
    UpdateCadastroInfoInput,
    CadastroInfoFilter
  >
  implements CadastroInfoRepository
{
  constructor(
    @InjectModel(CadastroInfoSchemaClass.name)
    protected readonly model: Model<CadastroInfoDocument>,
    protected readonly cacheService: CacheService,
  ) {
    super(model, cacheService);
  }

  protected toDomain(doc: any): CadastroInfo {
    return {
      id: doc._id?.toString(),
      startDate: doc.START_DATE,
      endDate: doc.END_DATE,
      formId: extractId(doc.FORM_ID),
      isActive: doc.IS_ACTIVE,
      createdAt: doc.createdAt ? new Date(doc.createdAt) : undefined,
      updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : undefined,
    };
  }

  protected buildFilter(filter?: CadastroInfoFilter): Record<string, any> {
    return mapProps(filter as any, {
      startDate: 'START_DATE',
      endDate: 'END_DATE',
      formId: 'FORM_ID',
      isActive: 'IS_ACTIVE',
      fields: 'fields',
    });
  }

  protected toPersistence(data: CreateCadastroInfoInput | UpdateCadastroInfoInput): any {
    return mapProps(data as any, {
      startDate: 'START_DATE',
      endDate: 'END_DATE',
      formId: 'FORM_ID',
      isActive: 'IS_ACTIVE',
    });
  }

  async update(id: string, data: UpdateCadastroInfoInput): Promise<CadastroInfo> {
    const updated = await this.model
      .findByIdAndUpdate(id, { $set: this.toPersistence(data) }, { new: true, lean: true })
      .exec();
    if (!updated) {
      throw new NotFoundException('Cadastro info not found');
    }
    return this.toDomain(updated);
  }

  async findActive(): Promise<CadastroInfo | null> {
    const doc = await this.model
      .findOne({ IS_ACTIVE: true })
      .sort({ updatedAt: -1, createdAt: -1 })
      .lean()
      .exec();
    return doc ? this.toDomain(doc) : null;
  }
}
