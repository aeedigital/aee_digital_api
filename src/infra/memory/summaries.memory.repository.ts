import { Injectable } from '@nestjs/common';
import { Summary } from '../../domain/entities/summary';
import {
  CreateSummaryInput,
  SummaryFilter,
  SummaryRepository,
  SummaryManyFilter,
  SummaryStatsParams,
  SummaryStatsResult,
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
{
  async findAll(filter?: SummaryFilter): Promise<Summary[]> {
    let items = await super.findAll(filter);
    if (filter?.dateFrom || filter?.dateTo) {
      items = items.filter((s) => {
        const created = s.createdAt || new Date();
        const after = filter.dateFrom ? created >= filter.dateFrom : true;
        const before = filter.dateTo ? created <= filter.dateTo : true;
        return after && before;
      });
    }
    if (filter?.skip) items = items.slice(filter.skip);
    if (filter?.limit) items = items.slice(0, filter.limit);
    return items;
  }

  async stats(params: SummaryStatsParams): Promise<SummaryStatsResult> {
    const items = await this.findAll({ dateFrom: params.dateFrom, dateTo: params.dateTo });
    const eventsByDay: Record<string, number> = {};
    const centers = new Set<string>();
    for (const s of items) {
      const day = (s.createdAt || new Date()).toISOString().slice(0, 10);
      eventsByDay[day] = (eventsByDay[day] || 0) + 1;
      centers.add(s.centroId);
    }
    return {
      eventsByDay,
      respondedCount: centers.size,
      totalCentros: centers.size,
    };
  }

  async findByCentroIds(filter: SummaryManyFilter): Promise<Summary[]> {
    const items = await this.findAll({
      dateFrom: filter.dateFrom,
      dateTo: filter.dateTo,
    });
    const filtered = items.filter((s) => filter.centroIds.includes(s.centroId));
    const sorted = [...filtered].sort((a, b) =>
      (filter.sort?.updatedAt ?? -1) === -1
        ? (b.updatedAt?.getTime() || 0) - (a.updatedAt?.getTime() || 0)
        : (a.updatedAt?.getTime() || 0) - (b.updatedAt?.getTime() || 0),
    );
    return sorted;
  }
}
