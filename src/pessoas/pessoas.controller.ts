import { PessoasService as Service } from './pessoas.service';
import { Pessoas as Schema } from './schemas/pessoas.schema';
import { FilterDto } from './dto/filter-pessoas.dto';
import { CreatePessoasDto as CreateDto } from './dto/create-pessoas.dto';

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

@Controller('pessoas')
export class PessoasController {
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
