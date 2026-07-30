import { Injectable } from '@nestjs/common';
import { Centro } from '../../domain/entities/centro';
import {
  CentroFilter,
  CentroRepository,
  CreateCentroInput,
  UpdateCentroInput,
} from '../../domain/repositories/centro.repository';
import { BaseMemoryRepository } from './base.memory.repository';

@Injectable()
export class CentrosMemoryRepository
  extends BaseMemoryRepository<Centro, CreateCentroInput, UpdateCentroInput, CentroFilter>
  implements CentroRepository
{}
