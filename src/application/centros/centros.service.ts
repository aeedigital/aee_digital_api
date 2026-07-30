import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  CentroFilter,
  CentroRepository,
  CreateCentroInput,
  UpdateCentroInput,
} from '../../domain/repositories/centro.repository';
import { Centro } from '../../domain/entities/centro';
import { CENTRO_REPOSITORY } from '../../domain/repositories/repository.tokens';
import { SummaryAppService } from '../summary/summary.service';
import { SummaryFilter } from '../../domain/repositories/summary.repository';
import { Summary } from '../../domain/entities/summary';

@Injectable()
export class CentrosAppService {
  constructor(
    @Inject(CENTRO_REPOSITORY)
    private readonly repository: CentroRepository,
    private readonly summariesService: SummaryAppService,
  ) {}

  create(data: CreateCentroInput): Promise<Centro> {
    return this.repository.create(data);
  }

  findAll(filter?: CentroFilter): Promise<Centro[]> {
    return this.repository.findAll(filter);
  }

  async findOne(id: string): Promise<Centro> {
    const centro = await this.repository.findById(id);
    if (!centro) {
      throw new NotFoundException('Centro not found');
    }
    return centro;
  }

  update(id: string, data: UpdateCentroInput): Promise<Centro> {
    return this.repository.update(id, data);
  }

  updateOrCreate(
    filter: Partial<CentroFilter> & { id?: string },
    data: CreateCentroInput,
  ): Promise<Centro> {
    return this.repository.updateOrCreate(filter, data);
  }

  delete(id: string): Promise<void> {
    return this.repository.delete(id);
  }

  findSummaries(id: string, filter: SummaryFilter): Promise<Summary[]> {
    const query: SummaryFilter = { ...filter, centroId: id };
    return this.summariesService.findAll(query);
  }
}
