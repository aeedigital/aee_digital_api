import { FilterDto } from './dto/filter-summaries.dto';
import { CreateSummariesDto as CreateDto, SummaryQuestion } from './dto/create-summaries.dto';
import { SummaryAppService as Service } from '../application/summary/summary.service';
import { Summary } from '../domain/entities/summary';

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

@Controller('summaries')
export class SummariesController {
  constructor(private readonly service: Service) { }

  private toFilter(filterDto: FilterDto) {
    return {
      formId: filterDto.FORM_ID,
      centroId: filterDto.CENTRO_ID,
      fields: filterDto.fields,
    };
  }

  private toInput(dto: CreateDto | UpdateSummaryDto) {
    return {
      formId: dto.FORM_ID,
      centroId: dto.CENTRO_ID,
      questions: (dto.QUESTIONS as SummaryQuestion[] | undefined)?.map(
        (q) => ({
          answer: q.ANSWER,
          questionId:
            (q as any).QUESTION?._id?.toString?.() ??
            (q as any).QUESTION?.toString?.() ??
            (q as any).QUESTION,
        }),
      ),
      validatedByCoordAt: dto.validatedByCoordAt,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new resource' })
  create(@Body() createDto: CreateDto) {
    return this.service.create(this.toInput(createDto));
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
    return this.service.update(id, this.toInput(updateDto));
  }

  @Patch(':id/validated-by-coord')
  updateValidatedByCoord(@Param('id') id: string) {
    const validatedByCoordAt = new Date();

    const updatedPass: UpdateSummaryDto = {
      validatedByCoordAt,
    }

    return this.service.update(id, this.toInput(updatedPass as any));
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
