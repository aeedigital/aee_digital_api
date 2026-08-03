import { FilterDto } from './dto/filter-summaries.dto';
import { CreateSummariesDto as CreateDto, SummaryQuestion } from './dto/create-summaries.dto';
import { SummaryAppService as Service } from '../application/summary/summary.service';
import { Summary } from '../domain/entities/summary';
import {
  CreateSummaryInput,
  UpdateSummaryInput,
} from '../domain/repositories/summary.repository';

import {
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
import { UpdateSummaryDto } from './dto/update-summary.dto';
import { mapProps } from '../base/mappers/object.mapper';
import { extractId } from '../base/mappers/mongo-id.mapper';
import { StatsSummariesDto } from './dto/stats-summaries.dto';
import { toSummaryResponse } from './summary.presenter';
import { parseDateInput } from '../base/date-parse.helper';

@Controller('summaries')
export class SummariesController {
  constructor(private readonly service: Service) { }

  private toFilter(filterDto: FilterDto) {
    const mapped = mapProps(filterDto, {
      FORM_ID: 'formId',
      CENTRO_ID: 'centroId',
      fields: 'fields',
    });
    const dateFrom = parseDateInput(filterDto.dateFrom);
    const dateTo = parseDateInput(filterDto.dateTo);
    const limit = filterDto.limit ? parseInt(filterDto.limit, 10) : undefined;
    const skip = filterDto.skip ? parseInt(filterDto.skip, 10) : undefined;
    const sort =
      filterDto.sort &&
      filterDto.sort.split(',').reduce((acc, part) => {
        const [field, dir] = part.split(':');
        if (field) acc[field] = dir === '-1' ? -1 : 1;
        return acc;
      }, {} as Record<string, 1 | -1>);
    return {
      ...mapped,
      ...(dateFrom ? { dateFrom } : {}),
      ...(dateTo ? { dateTo } : {}),
      ...(limit ? { limit } : {}),
      ...(skip ? { skip } : {}),
      ...(sort && Object.keys(sort).length ? { sort } : {}),
    };
  }

  private toCreateInput(dto: CreateDto): CreateSummaryInput {
    const payload = mapProps<any, CreateSummaryInput>(dto as any, {
      FORM_ID: 'formId',
      CENTRO_ID: 'centroId',
      validatedByCoordAt: 'validatedByCoordAt',
    });
    const questions = (dto.QUESTIONS as SummaryQuestion[] | undefined)?.map(
      (q) => ({
        answer: q.ANSWER,
        questionId: extractId((q as any).QUESTION),
        answerId: q.ANSWER_ID,
        groupKey: q.GROUP_KEY,
        groupInstanceId: q.GROUP_INSTANCE_ID,
        occurrenceOrder: q.OCCURRENCE_ORDER,
        questionOrder: q.QUESTION_ORDER,
      }),
    );
    return {
      ...payload,
      ...(questions ? { questions } : {}),
    };
  }

  private toUpdateInput(dto: UpdateSummaryDto): UpdateSummaryInput {
    const payload = mapProps<any, UpdateSummaryInput>(dto as any, {
      FORM_ID: 'formId',
      CENTRO_ID: 'centroId',
      validatedByCoordAt: 'validatedByCoordAt',
    });
    const questions = (dto.QUESTIONS as SummaryQuestion[] | undefined)?.map(
      (q) => ({
        answer: q.ANSWER,
        questionId: extractId((q as any).QUESTION),
        answerId: q.ANSWER_ID,
        groupKey: q.GROUP_KEY,
        groupInstanceId: q.GROUP_INSTANCE_ID,
        occurrenceOrder: q.OCCURRENCE_ORDER,
        questionOrder: q.QUESTION_ORDER,
      }),
    );
    return {
      ...payload,
      ...(questions ? { questions } : {}),
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new resource' })
  create(@Body() createDto: CreateDto) {
    return this.service.create(this.toCreateInput(createDto)).then(toSummaryResponse);
  }

  @Get()
  findAll(@Query(ValidationPipe) filterDto: FilterDto): Promise<any[]> {
    return this.service.findAll(this.toFilter(filterDto)).then((items) => items.map(toSummaryResponse));
  }

  @Get('stats')
  stats(@Query(ValidationPipe) filter: StatsSummariesDto) {
    return this.service.stats({
      dateFrom: parseDateInput(filter.dateFrom),
      dateTo: parseDateInput(filter.dateTo),
      status: filter.status,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<any> {
    return this.service.findOne(id).then(toSummaryResponse);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateSummaryDto) {
    return this.service.update(id, this.toUpdateInput(updateDto)).then(toSummaryResponse);
  }

  @Patch(':id/validated-by-coord')
  updateValidatedByCoord(@Param('id') id: string) {
    return this.service.validateByCoordinator(id).then(toSummaryResponse);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
