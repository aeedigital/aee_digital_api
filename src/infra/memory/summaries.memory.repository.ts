import { Injectable } from '@nestjs/common';
import { Summary } from '../../domain/entities/summary';
import {
  CreateSummaryInput,
  SummaryFilter,
  SummaryRepository,
  UpdateSummaryInput,
} from '../../domain/repositories/summary.repository';
import { BaseMemoryRepository } from './base.memory.repository';

@Injectable()
export class SummariesMemoryRepository
  extends BaseMemoryRepository<
    Summary,
    CreateSummaryInput,
    UpdateSummaryInput,
    SummaryFilter
  >
  implements SummaryRepository
{}
