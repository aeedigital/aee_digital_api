import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  CreateRegionalInput,
  RegionalFilter,
  RegionalRepository,
  RegionalOverviewFilter,
  RegionalOverviewItem,
  UpdateRegionalInput,
} from '../../domain/repositories/regional.repository';
import { Regional } from '../../domain/entities/regional';
import { REGIONAL_REPOSITORY } from '../../domain/repositories/repository.tokens';
import { CentrosAppService } from '../centros/centros.service';
import { SummaryAppService } from '../summary/summary.service';
import { PessoasAppService } from '../pessoas/pessoas.service';
import { FormsAppService } from '../forms/forms.service';
import { AnswersAppService } from '../answers/answers.service';
import { CentroFilter } from '../../domain/repositories/centro.repository';
import { Centro } from '../../domain/entities/centro';
import { SummaryFilter, SummaryManyFilter } from '../../domain/repositories/summary.repository';
import { Summary } from '../../domain/entities/summary';

export interface CoordSummaryParams {
  dateFrom?: Date;
  dateTo?: Date;
}

export interface CentrosWithAnswersParams {
  dateFrom?: Date;
  dateTo?: Date;
  fields?: string;
  includeAnswers: boolean;
  includeSummaries: boolean;
  limitSummaries: number;
  sortBy?: string;
}

function parseSortBy(
  sortBy?: string,
  allowedFields?: string[],
): Record<string, 1 | -1> | undefined {
  if (!sortBy) return undefined;

  const sort = sortBy.split(',').reduce((acc, part) => {
    const [rawField, rawDirection] = part.split(':');
    const field = rawField?.trim();
    if (!field || (allowedFields && !allowedFields.includes(field))) {
      return acc;
    }

    const direction = rawDirection?.trim().toLowerCase();
    acc[field] = direction === 'desc' || direction === '-1' ? -1 : 1;
    return acc;
  }, {} as Record<string, 1 | -1>);

  return Object.keys(sort).length ? sort : undefined;
}

@Injectable()
export class RegionaisAppService {
  constructor(
    @Inject(REGIONAL_REPOSITORY)
    private readonly repository: RegionalRepository,
    private readonly centrosService: CentrosAppService,
    private readonly summariesService: SummaryAppService,
    private readonly pessoasService: PessoasAppService,
    private readonly formsService: FormsAppService,
    private readonly answersService: AnswersAppService,
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

  overview(filter: RegionalOverviewFilter): Promise<RegionalOverviewItem[]> {
    return this.repository.overview(filter);
  }

  async coordSummary(id: string, params: CoordSummaryParams) {
    const regional = await this.repository.findById(id);
    if (!regional) {
      throw new NotFoundException('Regional not found');
    }

    const centros = await this.centrosService.findAll({
      regional: id,
      sortBy: 'NOME_CENTRO',
    } as any);
    const centroIds = centros.map((c) => c.id).filter(Boolean);

    const summariesPromise =
      centroIds.length === 0
        ? Promise.resolve([])
        : this.summariesService.findLatestByCentroIds({
            centroIds,
            dateFrom: params.dateFrom,
            dateTo: params.dateTo,
            fields: 'FORM_ID,CENTRO_ID,QUESTIONS,createdAt,updatedAt',
          } as SummaryManyFilter);

    const [summaries, allRegionais, forms] = await Promise.all([
      summariesPromise,
      this.repository.findAll({}),
      this.formsService.findAll({} as any),
    ]);

    const formId = summaries.find((s: any) => s.formId)?.formId || forms.at(0)?.id;
    const form = formId ? await this.formsService.findOne(formId) : null;

    const coordIdSet = new Set<string>();
    const regionalCoordId = (regional as any).coordenadorId;
    if (regionalCoordId) coordIdSet.add(regionalCoordId);
    allRegionais.forEach((r: any) => {
      if (r.coordenadorId) coordIdSet.add(r.coordenadorId);
    });
    const coordenadores = await this.pessoasService.findByIds(Array.from(coordIdSet));
    const coordenador = regionalCoordId
      ? coordenadores.find((p: any) => p.id === regionalCoordId) || null
      : null;

    return {
      regional,
      coordenador,
      centros,
      summaries,
      form,
      coordenadores,
    };
  }

  async centrosWithAnswers(id: string, params: CentrosWithAnswersParams) {
    const sort = parseSortBy(params.sortBy, ['updatedAt', 'createdAt']);

    const centros = await this.centrosService.findAll({
      regional: id,
      fields: params.fields,
      sortBy: params.sortBy || 'NOME_CENTRO',
    } as any);
    const centroIds = centros.map((c) => c.id).filter(Boolean);

    const summariesPromise =
      params.includeSummaries && centroIds.length
        ? this.summariesService.findByCentroIds({
            centroIds,
            dateFrom: params.dateFrom,
            dateTo: params.dateTo,
            sort: sort || { updatedAt: -1 },
          })
        : Promise.resolve([]);

    const answersPromise =
      params.includeAnswers && centroIds.length
        ? this.answersService.findByCentroIds({
            centroIds,
            sortByUpdatedAt: sort?.updatedAt === -1,
          })
        : Promise.resolve([]);

    const [summaries, answers] = await Promise.all([summariesPromise, answersPromise]);

    const summariesByCentro = new Map<string, Summary[]>();
    summaries.forEach((s: any) => {
      const key = s.centroId;
      if (!summariesByCentro.has(key)) summariesByCentro.set(key, []);
      summariesByCentro.get(key)!.push(s);
    });

    const answersByCentro = new Map<string, any[]>();
    answers.forEach((a: any) => {
      const key = a.centroId;
      if (!answersByCentro.has(key)) answersByCentro.set(key, []);
      answersByCentro.get(key)!.push(a);
    });

    const centrosEnriched = centros.map((c) => ({
      centro: c,
      answers: params.includeAnswers ? answersByCentro.get(c.id) || [] : undefined,
      summaries: params.includeSummaries
        ? (summariesByCentro.get(c.id) || []).slice(0, params.limitSummaries)
        : undefined,
    }));

    return {
      regionalId: id,
      centros: centrosEnriched,
    };
  }
}
