import { Injectable } from '@nestjs/common';
import { Form } from '../../domain/entities/form';
import {
  CreateFormInput,
  FormFilter,
  FormRepository,
  UpdateFormInput,
} from '../../domain/repositories/form.repository';
import { BaseMemoryRepository } from './base.memory.repository';

@Injectable()
export class FormsMemoryRepository
  extends BaseMemoryRepository<Form, CreateFormInput, UpdateFormInput, FormFilter>
  implements FormRepository
{}
