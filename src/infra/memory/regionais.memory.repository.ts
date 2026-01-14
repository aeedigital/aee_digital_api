import { Injectable } from '@nestjs/common';
import { Regional } from '../../domain/entities/regional';
import {
  CreateRegionalInput,
  RegionalFilter,
  RegionalRepository,
  UpdateRegionalInput,
} from '../../domain/repositories/regional.repository';
import { BaseMemoryRepository } from './base.memory.repository';

@Injectable()
export class RegionaisMemoryRepository
  extends BaseMemoryRepository<
    Regional,
    CreateRegionalInput,
    UpdateRegionalInput,
    RegionalFilter
  >
  implements RegionalRepository
{}
