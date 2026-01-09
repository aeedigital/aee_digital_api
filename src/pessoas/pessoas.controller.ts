import { PessoasAppService as Service } from '../application/pessoas/pessoas.service';
import { Person } from '../domain/entities/person';
import { FilterDto } from './dto/filter-pessoas.dto';
import { CreatePessoasDto as CreateDto } from './dto/create-pessoas.dto';
import {
  CreatePersonInput,
  UpdatePersonInput,
} from '../domain/repositories/person.repository';

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
import { mapProps } from '../base/mappers/object.mapper';

@Controller('pessoas')
export class PessoasController {
  constructor(private readonly service: Service) {}

  private toFilter(filterDto: FilterDto) {
    return mapProps(filterDto as any, {
      NOME: 'name',
      'E-MAIL': 'email',
      CELULAR: 'celular',
      fields: 'fields',
    });
  }

  private toCreateInput(dto: CreateDto): CreatePersonInput {
    return mapProps<any, CreatePersonInput>(dto as any, {
      NOME: 'name',
      'E-MAIL': 'email',
      CELULAR: 'celular',
    });
  }

  private toUpdateInput(dto: CreateDto): UpdatePersonInput {
    return mapProps<any, UpdatePersonInput>(dto as any, {
      NOME: 'name',
      'E-MAIL': 'email',
      CELULAR: 'celular',
    });
  }

  @Post()
  @ApiOperation({ summary: 'Create a new resource' })
  create(@Body() createDto: CreateDto) {
    return this.service.create(this.toCreateInput(createDto));
  }

  @Get()
  findAll(@Query(ValidationPipe) filterDto: FilterDto): Promise<Person[]> {
    return this.service.findAll(this.toFilter(filterDto));
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Person> {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: CreateDto) {
    return this.service.update(id, this.toUpdateInput(updateDto));
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
