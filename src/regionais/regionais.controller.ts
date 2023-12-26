import { RegionalService as Service } from './regionais.service';
import { Regional as Schema } from './schemas/regionais.schema';
import { FilterDto } from './dto/filter-regional.dto';
import { CreateRegionalDto as CreateDto } from './dto/create-regional.dto';

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

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: CreateDto) {
    return this.service.update(id, updateDto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
