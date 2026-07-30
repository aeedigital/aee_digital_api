import { PessoasAppService as Service } from '../application/pessoas/pessoas.service';
import { Person } from '../domain/entities/person';
import { FilterDto } from './dto/filter-pessoas.dto';
import { CreatePessoasDto as CreateDto } from './dto/create-pessoas.dto';
import { UpdatePessoasDto } from './dto/update-pessoas.dto';
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
import { toPessoaResponse } from './pessoa.presenter';

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

  private toUpdateInput(dto: UpdatePessoasDto): UpdatePersonInput {
    return mapProps<any, UpdatePersonInput>(dto as any, {
      NOME: 'name',
      'E-MAIL': 'email',
      CELULAR: 'celular',
    });
  }

  @Post()
  @ApiOperation({ summary: 'Create a new resource' })
  create(@Body() createDto: CreateDto) {
    return this.service.create(this.toCreateInput(createDto)).then(toPessoaResponse);
  }

  @Get()
  findAll(@Query(ValidationPipe) filterDto: FilterDto): Promise<any[]> {
    return this.service.findAll(this.toFilter(filterDto)).then((items) => items.map(toPessoaResponse));
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<any> {
    return this.service.findOne(id).then(toPessoaResponse);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdatePessoasDto) {
    return this.service.update(id, this.toUpdateInput(updateDto)).then(toPessoaResponse);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
