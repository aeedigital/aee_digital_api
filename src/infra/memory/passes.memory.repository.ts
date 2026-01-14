import { Injectable } from '@nestjs/common';
import { Pass } from '../../domain/entities/pass';
import {
  CreatePassInput,
  PassFilter,
  PassRepository,
  UpdatePassInput,
} from '../../domain/repositories/pass.repository';
import { BaseMemoryRepository } from './base.memory.repository';

@Injectable()
export class PassesMemoryRepository
  extends BaseMemoryRepository<Pass, CreatePassInput, UpdatePassInput, PassFilter>
  implements PassRepository
{}
