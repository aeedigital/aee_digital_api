import { Person } from '../entities/person';
import { CrudRepository } from './crud.repository';

export type PersonFilter = Record<string, any>;

export interface CreatePersonInput {
  name: string;
  email: string;
  celular: string;
}

export interface UpdatePersonInput extends Partial<CreatePersonInput> {}

export interface PersonRepository
  extends CrudRepository<Person, CreatePersonInput, UpdatePersonInput, PersonFilter> {
  findByIds(ids: string[]): Promise<Person[]>;
}
