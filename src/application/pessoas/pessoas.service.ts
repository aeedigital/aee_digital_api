import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  CreatePersonInput,
  PersonFilter,
  PersonRepository,
  UpdatePersonInput,
} from '../../domain/repositories/person.repository';
import { Person } from '../../domain/entities/person';
import { PERSON_REPOSITORY } from '../../domain/repositories/repository.tokens';

@Injectable()
export class PessoasAppService {
  constructor(
    @Inject(PERSON_REPOSITORY)
    private readonly repository: PersonRepository,
  ) {}

  create(data: CreatePersonInput): Promise<Person> {
    return this.repository.create(data);
  }

  findAll(filter?: PersonFilter): Promise<Person[]> {
    return this.repository.findAll(filter);
  }

  async findOne(id: string): Promise<Person> {
    const person = await this.repository.findById(id);
    if (!person) {
      throw new NotFoundException('Person not found');
    }
    return person;
  }

  update(id: string, data: UpdatePersonInput): Promise<Person> {
    return this.repository.update(id, data);
  }

  updateOrCreate(
    filter: Partial<PersonFilter> & { id?: string },
    data: CreatePersonInput,
  ): Promise<Person> {
    return this.repository.updateOrCreate(filter, data);
  }

  delete(id: string): Promise<void> {
    return this.repository.delete(id);
  }
}
