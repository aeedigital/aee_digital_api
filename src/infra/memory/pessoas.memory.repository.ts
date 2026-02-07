import { Injectable } from '@nestjs/common';
import { Person } from '../../domain/entities/person';
import {
  CreatePersonInput,
  PersonFilter,
  PersonRepository,
  UpdatePersonInput,
} from '../../domain/repositories/person.repository';
import { BaseMemoryRepository } from './base.memory.repository';

@Injectable()
export class PessoasMemoryRepository
  extends BaseMemoryRepository<Person, CreatePersonInput, UpdatePersonInput, PersonFilter>
  implements PersonRepository
{
  async findByIds(ids: string[]): Promise<Person[]> {
    if (!ids.length) return [];
    const items = await this.findAll();
    const idSet = new Set(ids);
    return items.filter((item) => item.id && idSet.has(item.id));
  }
}
