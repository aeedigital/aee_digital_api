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
{}
