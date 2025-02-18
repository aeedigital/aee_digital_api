import { RegionalService as Service } from './regionais.service';
import { Regional as Schema } from './schemas/regionais.schema';
import { FilterDto } from './dto/filter-regional.dto';
import { CreateRegionalDto as CreateDto } from './dto/create-regional.dto';

import { FilterDto as SummaryFilterDto } from '../summary/dto/filter-summaries.dto';
import { FilterDto as CentroFilterDto } from '../centros/dto/filter-centro.dto';

import { Summaries as SummariesSchema } from '../summary/schemas/summaries.schema';
import { Centro as CentrosSchema } from '../centros/schemas/centro.schema';

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
import { UpdateRegionalDto } from './dto/update-regional.dto';

@Controller('regionais')
export class RegionaisController {
  constructor(private readonly service: Service) {}

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

  @Get(':id/centros')
  async findCentros(@Param('id') id: string, @Query(ValidationPipe) filterDto: CentroFilterDto): Promise<CentrosSchema[]> {
    return await this.service.findCentros(id, filterDto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateRegionalDto) {
    return this.service.update(id, updateDto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
