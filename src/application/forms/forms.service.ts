import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  CreateFormInput,
  FormFilter,
  FormRepository,
  UpdateFormInput,
} from '../../domain/repositories/form.repository';
import { Form } from '../../domain/entities/form';
import { FORM_REPOSITORY } from '../../forms/forms.tokens';

@Injectable()
export class FormsAppService {
  constructor(
    @Inject(FORM_REPOSITORY)
    private readonly repository: FormRepository,
  ) {}

  create(data: CreateFormInput): Promise<Form> {
    return this.repository.create(data);
  }

  findAll(filter?: FormFilter): Promise<Form[]> {
    return this.repository.findAll(filter);
  }

  async findOne(id: string): Promise<Form> {
    const form = await this.repository.findById(id);
    if (!form) {
      throw new NotFoundException('Form not found');
    }
    return form;
  }

  update(id: string, data: UpdateFormInput): Promise<Form> {
    return this.repository.update(id, data);
  }

  updateOrCreate(
    filter: Partial<FormFilter> & { id?: string },
    data: CreateFormInput,
  ): Promise<Form> {
    return this.repository.updateOrCreate(filter, data);
  }

  delete(id: string): Promise<void> {
    return this.repository.delete(id);
  }
}
