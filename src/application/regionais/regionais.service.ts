import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  CreateRegionalInput,
  RegionalFilter,
  RegionalRepository,
  UpdateRegionalInput,
} from '../../domain/repositories/regional.repository';
import { Regional } from '../../domain/entities/regional';
import { REGIONAL_REPOSITORY } from '../../domain/repositories/repository.tokens';
import { CentrosAppService } from '../centros/centros.service';
import { SummaryAppService } from '../summary/summary.service';
import { CentroFilter } from '../../domain/repositories/centro.repository';
import { Centro } from '../../domain/entities/centro';
import { SummaryFilter } from '../../domain/repositories/summary.repository';
import { Summary } from '../../domain/entities/summary';

@Injectable()
export class RegionaisAppService {
  constructor(
    @Inject(REGIONAL_REPOSITORY)
    private readonly repository: RegionalRepository,
    private readonly centrosService: CentrosAppService,
    private readonly summariesService: SummaryAppService,
  ) {}

  create(data: CreateRegionalInput): Promise<Regional> {
    return this.repository.create(data);
  }

  findAll(filter?: RegionalFilter): Promise<Regional[]> {
    return this.repository.findAll(filter);
  }

  async findOne(id: string): Promise<Regional> {
    const regional = await this.repository.findById(id);
    if (!regional) {
      throw new NotFoundException('Regional not found');
    }
    return regional;
  }

  update(id: string, data: UpdateRegionalInput): Promise<Regional> {
    return this.repository.update(id, data);
  }

  updateOrCreate(
    filter: Partial<RegionalFilter> & { id?: string },
    data: CreateRegionalInput,
  ): Promise<Regional> {
    return this.repository.updateOrCreate(filter, data);
  }

  delete(id: string): Promise<void> {
    return this.repository.delete(id);
  }

  findCentros(id: string, filter: CentroFilter): Promise<Centro[]> {
    const query: CentroFilter = { ...filter, regional: id };
    return this.centrosService.findAll(query);
  }

  async findSummaries(
    id: string,
    filter: SummaryFilter,
  ): Promise<Summary[]> {
    const centros = await this.centrosService.findAll({ regional: id });
    const summariesArray = await Promise.all(
      centros.map((centro) =>
        this.summariesService.findAll({ ...filter, centroId: centro.id }),
      ),
    );
    return summariesArray.flat();
  }
}
