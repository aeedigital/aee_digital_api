import { CentrosAppService as Service } from '../application/centros/centros.service';
import { Centro } from '../domain/entities/centro';

import { Summary } from '../domain/entities/summary';
import { CreateCentroDto as CreateDto } from './dto/create-centro.dto';
import { FilterDto } from './dto/filter-centro.dto';
import {
  CreateCentroInput,
  UpdateCentroInput,
} from '../domain/repositories/centro.repository';

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
import { mapProps } from '../base/mappers/object.mapper';

@Controller('centros')
export class CentrosController {
  constructor(
    private readonly service: Service
  
  ) {}

  private toFilter(filterDto: FilterDto) {
    return mapProps(filterDto, {
      FUNCIONAMENTO: 'funcionamento',
      NOME_CENTRO: 'nomeCentro',
      NOME_CURTO: 'nomeCurto',
      CNPJ_CENTRO: 'cnpjCentro',
      DATA_FUNDACAO: 'dataFundacao',
      REGIONAL: 'regional',
      ENDERECO: 'endereco',
      CEP: 'cep',
      BAIRRO: 'bairro',
      CIDADE: 'cidade',
      ESTADO: 'estado',
      PAIS: 'pais',
      fields: 'fields',
    });
  }

  private toCreateInput(dto: CreateDto): CreateCentroInput {
    return mapProps<any, CreateCentroInput>(dto as any, {
      FUNCIONAMENTO: 'funcionamento',
      NOME_CENTRO: 'nomeCentro',
      NOME_CURTO: 'nomeCurto',
      CNPJ_CENTRO: 'cnpjCentro',
      DATA_FUNDACAO: 'dataFundacao',
      REGIONAL: 'regional',
      ENDERECO: 'endereco',
      CEP: 'cep',
      BAIRRO: 'bairro',
      CIDADE: 'cidade',
      ESTADO: 'estado',
      PAIS: 'pais',
    });
  }

  private toUpdateInput(dto: CreateDto): UpdateCentroInput {
    return mapProps<any, UpdateCentroInput>(dto as any, {
      FUNCIONAMENTO: 'funcionamento',
      NOME_CENTRO: 'nomeCentro',
      NOME_CURTO: 'nomeCurto',
      CNPJ_CENTRO: 'cnpjCentro',
      DATA_FUNDACAO: 'dataFundacao',
      REGIONAL: 'regional',
      ENDERECO: 'endereco',
      CEP: 'cep',
      BAIRRO: 'bairro',
      CIDADE: 'cidade',
      ESTADO: 'estado',
      PAIS: 'pais',
    });
  }

  private toSummaryFilter(filterDto: SummaryFilterDto) {
    return {
      formId: filterDto.FORM_ID,
      centroId: filterDto.CENTRO_ID,
      fields: filterDto.fields,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new resource' })
  create(@Body() createDto: CreateDto) {
    return this.service.create(this.toCreateInput(createDto));
  }

  @Get()
  findAll(@Query(ValidationPipe) filterDto: FilterDto): Promise<Centro[]> {
    return this.service.findAll(this.toFilter(filterDto));
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Centro> {
    return this.service.findOne(id);
  }

  @Get(':id/summaries')
  async findSummaries(@Param('id') id: string, @Query(ValidationPipe) filterDto: SummaryFilterDto): Promise<Summary[]> {
    return await this.service.findSummaries(id, this.toSummaryFilter(filterDto));
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
