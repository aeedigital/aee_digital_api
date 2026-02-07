import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  CreateSummaryInput,
  SummaryFilter,
  SummaryRepository,
  SummaryStatsParams,
  SummaryStatsResult,
  SummaryManyFilter,
  UpdateSummaryInput,
} from '../../domain/repositories/summary.repository';
import { Summary } from '../../domain/entities/summary';
import { SUMMARY_REPOSITORY } from '../../domain/repositories/repository.tokens';

@Injectable()
export class SummaryAppService {
  constructor(
    @Inject(SUMMARY_REPOSITORY)
    private readonly repository: SummaryRepository,
  ) {}

  create(data: CreateSummaryInput): Promise<Summary> {
    return this.repository.create(data);
  }

  findAll(filter?: SummaryFilter): Promise<Summary[]> {
    return this.repository.findAll(filter);
  }

  stats(params: SummaryStatsParams): Promise<SummaryStatsResult> {
    return this.repository.stats(params);
  }

  findByCentroIds(filter: SummaryManyFilter): Promise<Summary[]> {
    return this.repository.findByCentroIds(filter);
  }

  findLatestByCentroIds(filter: SummaryManyFilter): Promise<Summary[]> {
    return this.repository.findLatestByCentroIds(filter);
  }

  async findOne(id: string): Promise<Summary> {
    const summary = await this.repository.findById(id);
    if (!summary) {
      throw new NotFoundException('Summary not found');
    }
    return summary;
  }

  update(id: string, data: UpdateSummaryInput): Promise<Summary> {
    return this.repository.update(id, data);
  }

  updateOrCreate(
    filter: Partial<SummaryFilter> & { id?: string },
    data: CreateSummaryInput,
  ): Promise<Summary> {
    return this.repository.updateOrCreate(filter, data);
  }

  delete(id: string): Promise<void> {
    return this.repository.delete(id);
  }
}
