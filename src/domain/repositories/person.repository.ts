import { Person } from '../entities/person';

export type PersonFilter = Record<string, any>;

export interface CreatePersonInput {
  name: string;
  email: string;
  celular: string;
}

export interface UpdatePersonInput extends Partial<CreatePersonInput> {}

export interface PersonRepository {
  create(data: CreatePersonInput): Promise<Person>;
  findAll(filter?: PersonFilter): Promise<Person[]>;
  findById(id: string): Promise<Person | null>;
  update(id: string, data: UpdatePersonInput): Promise<Person>;
  updateOrCreate(
    filter: Partial<PersonFilter> & { id?: string },
    data: CreatePersonInput,
  ): Promise<Person>;
  delete(id: string): Promise<void>;
}
