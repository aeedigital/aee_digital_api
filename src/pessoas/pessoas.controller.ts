import { PessoasAppService as Service } from '../application/pessoas/pessoas.service';
import { Person } from '../domain/entities/person';
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

  private toFilter(filterDto: FilterDto) {
    return {
      name: filterDto.NOME,
      email: (filterDto as any)['E-MAIL'],
      celular: filterDto.CELULAR,
      fields: filterDto.fields,
    };
  }

  private toInput(dto: CreateDto) {
    return {
      name: dto.NOME,
      email: dto['E-MAIL'],
      celular: dto.CELULAR,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new resource' })
  create(@Body() createDto: CreateDto) {
    return this.service.create(this.toInput(createDto));
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
    return this.service.update(id, this.toInput(updateDto));
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
