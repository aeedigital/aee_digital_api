import { RegionaisAppService as Service } from '../application/regionais/regionais.service';
import { Regional } from '../domain/entities/regional';
import { FilterDto } from './dto/filter-regional.dto';
import { CreateRegionalDto as CreateDto } from './dto/create-regional.dto';
import {
  CreateRegionalInput,
  UpdateRegionalInput,
} from '../domain/repositories/regional.repository';

import { FilterDto as SummaryFilterDto } from '../summary/dto/filter-summaries.dto';
import { FilterDto as CentroFilterDto } from '../centros/dto/filter-centro.dto';
import { OverviewRegionalDto } from './dto/overview-regional.dto';

import { Summary } from '../domain/entities/summary';
import { Centro } from '../domain/entities/centro';

import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { UpdateRegionalDto } from './dto/update-regional.dto';
import { mapProps } from '../base/mappers/object.mapper';
import { toSummaryResponse } from '../summary/summary.presenter';
import { toRegionalResponse } from './regional.presenter';
import { toCentroResponse } from '../centros/centro.presenter';
import { parseDateInput } from '../base/date-parse.helper';
import { CoordSummaryQueryDto } from './dto/coord-summary.dto';
import { toCoordSummaryResponse } from './coord-summary.presenter';
import { CentrosWithAnswersQueryDto } from './dto/centros-with-answers.dto';
import { toAnswerResponse } from '../answers/answer.presenter';
import { OVERVIEW_DEFAULT_EXCLUDE_RULE } from '../application/regionais/constants/overview-exclusion.constants';
import { RegionalOverviewExcludeRule } from '../domain/repositories/regional.repository';

@Controller('regionais')
export class RegionaisController {
  constructor(private readonly service: Service) {}

  private toFilter(filterDto: FilterDto) {
    return mapProps(filterDto, {
      NOME_REGIONAL: 'nomeRegional',
      PAIS: 'pais',
      COORDENADOR_ID: 'coordenadorId',
      fields: 'fields',
    });
  }

  private toCreateInput(dto: CreateDto): CreateRegionalInput {
    return mapProps<any, CreateRegionalInput>(dto as any, {
      NOME_REGIONAL: 'nomeRegional',
      PAIS: 'pais',
      COORDENADOR_ID: 'coordenadorId',
    });
  }

  private toUpdateInput(dto: UpdateRegionalDto): UpdateRegionalInput {
    return mapProps<any, UpdateRegionalInput>(dto as any, {
      NOME_REGIONAL: 'nomeRegional',
      PAIS: 'pais',
      COORDENADOR_ID: 'coordenadorId',
    });
  }

  private toSummaryFilter(filterDto: SummaryFilterDto) {
    return mapProps(filterDto, {
      FORM_ID: 'formId',
      CENTRO_ID: 'centroId',
      fields: 'fields',
    });
  }

  private toCentroFilter(filterDto: CentroFilterDto) {
    return mapProps(filterDto, {
      NOME_CENTRO: 'nomeCentro',
      NOME_CURTO: 'nomeCurto',
      CNPJ_CENTRO: 'cnpjCentro',
      DATA_FUNDACAO: 'dataFundacao',
      REGIONAL: 'regional',
      ENDERECO: 'endereco',
      CEP: 'cep',
      BAIRRO: 'bairro',
      CIDADE: 'cidade',
      ESTADO: 'estado',
      PAIS: 'pais',
      fields: 'fields',
    });
  }

  @Post()
  @ApiOperation({ summary: 'Create a new resource' })
  create(@Body() createDto: CreateDto) {
    return this.service.create(this.toCreateInput(createDto)).then(toRegionalResponse);
  }

  @Get()
  findAll(@Query(ValidationPipe) filterDto: FilterDto): Promise<any[]> {
    return this.service.findAll(this.toFilter(filterDto)).then((items) => items.map(toRegionalResponse));
  }

  @Get('overview')
  overview(@Query(ValidationPipe) filterDto: OverviewRegionalDto) {
    const status = filterDto.status
      ? filterDto.status.split(',').map((s) => s.trim()).filter(Boolean)
      : undefined;
    const hasCustomQuestionId = !!filterDto.excludeQuestionId;
    const hasCustomAnswers = !!filterDto.excludeAnswers;

    if (hasCustomQuestionId !== hasCustomAnswers) {
      throw new BadRequestException(
        'excludeQuestionId and excludeAnswers must be informed together',
      );
    }

    let excludeRule: RegionalOverviewExcludeRule | undefined;
    if (hasCustomQuestionId && hasCustomAnswers) {
      const answers = filterDto.excludeAnswers!
        .split(',')
        .map((answer) => answer.trim())
        .filter(Boolean);

      if (!answers.length) {
        throw new BadRequestException('excludeAnswers must contain at least one answer');
      }

      excludeRule = {
        questionId: filterDto.excludeQuestionId!,
        answers,
        summarySelection: 'latest',
        matchMode: 'trim-case-insensitive',
      };
    } else if (filterDto.applyDefaultExclusion === 'true') {
      excludeRule = OVERVIEW_DEFAULT_EXCLUDE_RULE;
    }

    return this.service.overview({
      dateFrom: parseDateInput(filterDto.dateFrom),
      dateTo: parseDateInput(filterDto.dateTo),
      status,
      excludeRule,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<any> {
    return this.service.findOne(id).then(toRegionalResponse);
  }

  @Get(':id/summaries')
  async findSummaries(@Param('id') id: string, @Query(ValidationPipe) filterDto: SummaryFilterDto): Promise<any[]> {
    const items = await this.service.findSummaries(id, {
      ...this.toSummaryFilter(filterDto),
      ...(parseDateInput(filterDto.dateFrom) ? { dateFrom: parseDateInput(filterDto.dateFrom) } : {}),
      ...(parseDateInput(filterDto.dateTo) ? { dateTo: parseDateInput(filterDto.dateTo) } : {}),
    });
    return items.map(toSummaryResponse);
  }

  @Get(':id/centros')
  async findCentros(@Param('id') id: string, @Query(ValidationPipe) filterDto: CentroFilterDto): Promise<any[]> {
    const centros = await this.service.findCentros(id, this.toCentroFilter(filterDto));
    return centros.map(toCentroResponse);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateRegionalDto) {
    return this.service.update(id, this.toUpdateInput(updateDto)).then(toRegionalResponse);
  }

  @Get(':id/coord-summary')
  async coordSummary(
    @Param('id') id: string,
    @Query(ValidationPipe) query: CoordSummaryQueryDto,
  ) {
    const dateFrom = parseDateInput(query.dateFrom);
    const dateTo = parseDateInput(query.dateTo);
    const data = await this.service.coordSummary(id, { dateFrom, dateTo });
    return toCoordSummaryResponse(data);
  }

  @Get(':id/centros-with-answers')
  async centrosWithAnswers(
    @Param('id') id: string,
    @Query(ValidationPipe) query: CentrosWithAnswersQueryDto,
  ) {
    const dateFrom = parseDateInput(query.dateFrom);
    const dateTo = parseDateInput(query.dateTo);
    const includeRaw = query.include || 'answers,summaries';
    const includeSet = new Set(includeRaw.split(',').map((s) => s.trim()).filter(Boolean));
    const includeAnswers = includeSet.has('answers');
    const includeSummaries = includeSet.has('summaries');
    const limitSummaries = query.limitSummaries ? parseInt(query.limitSummaries, 10) : 1;

    const data = await this.service.centrosWithAnswers(id, {
      dateFrom,
      dateTo,
      fields: query.fields,
      includeAnswers,
      includeSummaries,
      limitSummaries,
      sortBy: query.sortBy,
    });

    return {
      regionalId: data.regionalId,
      totals: data.totals,
      centros: data.centros.map((item) => {
        const base = toCentroResponse(item.centro);
        return {
          ...base,
          ...(includeAnswers
            ? { answers: (item.answers || []).map((a: any) => toAnswerResponse(a)) }
            : {}),
          ...(includeSummaries
            ? { summaries: (item.summaries || []).map((s: any) => toSummaryResponse(s)) }
            : {}),
        };
      }),
    };
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
