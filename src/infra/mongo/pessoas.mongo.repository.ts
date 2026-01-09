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
import { mapProps, omitUndefined } from '../../base/mappers/object.mapper';

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
    const core: Omit<Person, 'id'> = mapProps(doc as any, {
      NOME: 'name',
      'E-MAIL': 'email',
      CELULAR: 'celular',
    });
    return {
      id: doc._id?.toString(),
      ...core,
    };
  }

  protected buildFilter(filter?: PersonFilter): Record<string, any> {
    return mapProps(filter as any, {
      name: 'NOME',
      email: 'E-MAIL',
      celular: 'CELULAR',
      fields: 'fields',
    });
  }

  protected toPersistence(data: CreatePersonInput | UpdatePersonInput) {
    const payload = mapProps(data as any, {
      name: 'NOME',
      email: 'E-MAIL',
      celular: 'CELULAR',
    });
    return omitUndefined(payload);
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
