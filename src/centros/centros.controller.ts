import { CentrosService as Service } from './centros.service';
import { Centro as Schema } from './schemas/centro.schema';

import { Summaries as SummariesSchema } from '../summary/schemas/summaries.schema';
import { CreateCentroDto as CreateDto } from './dto/create-centro.dto';
import { FilterDto } from './dto/filter-centro.dto';

import { FilterDto as SummaryFilterDto } from '../summary/dto/filter-summaries.dto';

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

@Controller('centros')
export class CentrosController {
  constructor(
    private readonly service: Service
  
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new resource' })
  create(@Body() createDto: CreateDto) {
    return this.service.create(createDto);
  }

  @Get()
  findAll(@Query(ValidationPipe) filterDto: FilterDto): Promise<Schema[]> {
    return this.service.findAll(filterDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Schema> {
    return this.service.findOne(id);
  }

  @Get(':id/summaries')
  async findSummaries(@Param('id') id: string, @Query(ValidationPipe) filterDto: SummaryFilterDto): Promise<SummariesSchema[]> {
    return await this.service.findSummaries(id, filterDto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: CreateDto) {
    return this.service.update(id, updateDto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
