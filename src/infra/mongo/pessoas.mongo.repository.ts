import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  CreatePersonInput,
  PersonFilter,
  PersonRepository,
  UpdatePersonInput,
} from '../../domain/repositories/person.repository';
import { Person } from '../../domain/entities/person';
import { PessoasDocument } from '../../pessoas/schemas/pessoas.schema';
import { CacheService } from '../../services/cache.service';
import { BaseMongoRepository } from './base.mongo.repository';

@Injectable()
export class PessoasMongoRepository
  extends BaseMongoRepository<Person, CreatePersonInput, UpdatePersonInput, PersonFilter>
  implements PersonRepository
{
  constructor(
    @InjectModel('Pessoas') protected readonly model: Model<PessoasDocument>,
    protected readonly cacheService: CacheService,
  ) {
    super(model, cacheService);
  }

  protected toDomain(doc: any): Person {
    return {
      id: doc._id?.toString(),
      name: doc.NOME,
      email: doc['E-MAIL'],
      celular: doc.CELULAR,
    };
  }

  protected buildFilter(filter?: PersonFilter): Record<string, any> {
    return {
      ...(filter?.name ? { NOME: filter.name } : {}),
      ...(filter?.email ? { 'E-MAIL': filter.email } : {}),
      ...(filter?.celular ? { CELULAR: filter.celular } : {}),
      ...(filter?.fields ? { fields: (filter as any).fields } : {}),
    };
  }

  protected toPersistence(data: CreatePersonInput | UpdatePersonInput) {
    const payload: Record<string, any> = {
      NOME: data.name,
      'E-MAIL': data.email,
      CELULAR: data.celular,
    };
    Object.keys(payload).forEach(
      (key) => payload[key] === undefined && delete payload[key],
    );
    return payload;
  }

  async update(id: string, data: UpdatePersonInput): Promise<Person> {
    const updated = await this.model
      .findByIdAndUpdate(id, { $set: this.toPersistence(data) }, { new: true, lean: true })
      .exec();
    if (!updated) {
      throw new NotFoundException('Person not found');
    }
    return this.toDomain(updated);
  }
}
