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

@Controller('summaries')
export class SummariesController {
  constructor(private readonly service: Service) { }

  private toFilter(filterDto: FilterDto) {
    return mapProps(filterDto, {
      FORM_ID: 'formId',
      CENTRO_ID: 'centroId',
      fields: 'fields',
    });
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
    return this.service.create(this.toCreateInput(createDto));
  }

  @Get()
  findAll(@Query(ValidationPipe) filterDto: FilterDto): Promise<Summary[]> {
    return this.service.findAll(this.toFilter(filterDto));
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Summary> {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateSummaryDto) {
    return this.service.update(id, this.toUpdateInput(updateDto));
  }

  @Patch(':id/validated-by-coord')
  updateValidatedByCoord(@Param('id') id: string) {
    const validatedByCoordAt = new Date();

    const updatedPass: UpdateSummaryDto = {
      validatedByCoordAt,
    }

    return this.service.update(id, this.toUpdateInput(updatedPass));
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
