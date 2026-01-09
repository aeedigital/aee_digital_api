import { Form } from '../entities/form';
import { CrudRepository } from './crud.repository';

export type FormFilter = Record<string, any>;

export interface CreateFormInput {
  name: string;
  version: number;
  createdBy: string;
  pages: Form['pages'];
}

export interface UpdateFormInput extends Partial<CreateFormInput> {}

export interface FormRepository
  extends CrudRepository<Form, CreateFormInput, UpdateFormInput, FormFilter> {}
