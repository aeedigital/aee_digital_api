import { Form } from '../entities/form';

export type FormFilter = Record<string, any>;

export interface CreateFormInput {
  name: string;
  version: number;
  createdBy: string;
  pages: Form['pages'];
}

export interface UpdateFormInput extends Partial<CreateFormInput> {}

export interface FormRepository {
  create(data: CreateFormInput): Promise<Form>;
  findAll(filter?: FormFilter): Promise<Form[]>;
  findById(id: string): Promise<Form | null>;
  update(id: string, data: UpdateFormInput): Promise<Form>;
  updateOrCreate(
    filter: Partial<FormFilter> & { id?: string },
    data: CreateFormInput,
  ): Promise<Form>;
  delete(id: string): Promise<void>;
}
