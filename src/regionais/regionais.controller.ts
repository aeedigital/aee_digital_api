import { RegionaisAppService as Service } from '../application/regionais/regionais.service';
import { Regional } from '../domain/entities/regional';
import { FilterDto } from './dto/filter-regional.dto';
import { CreateRegionalDto as CreateDto } from './dto/create-regional.dto';
import {
  CreateRegionalInput,
  UpdateRegionalInput,
} from '../domain/repositories/regional.repository';

import { FilterDto as SummaryFilterDto } from '../summary/dto/filter-summaries.dto';
import { FilterDto as CentroFilterDto } from '../centros/dto/filter-centro.dto';

import { Summary } from '../domain/entities/summary';
import { Centro } from '../domain/entities/centro';

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
import { mapProps } from '../base/mappers/object.mapper';

@Controller('regionais')
export class RegionaisController {
  constructor(private readonly service: Service) {}

  private toFilter(filterDto: FilterDto) {
    return mapProps(filterDto, {
      NOME_REGIONAL: 'nomeRegional',
      PAIS: 'pais',
      COORDENADOR_ID: 'coordenadorId',
      fields: 'fields',
    });
  }

  private toCreateInput(dto: CreateDto): CreateRegionalInput {
    return mapProps<any, CreateRegionalInput>(dto as any, {
      NOME_REGIONAL: 'nomeRegional',
      PAIS: 'pais',
      COORDENADOR_ID: 'coordenadorId',
    });
  }

  private toUpdateInput(dto: UpdateRegionalDto): UpdateRegionalInput {
    return mapProps<any, UpdateRegionalInput>(dto as any, {
      NOME_REGIONAL: 'nomeRegional',
      PAIS: 'pais',
      COORDENADOR_ID: 'coordenadorId',
    });
  }

  private toSummaryFilter(filterDto: SummaryFilterDto) {
    return mapProps(filterDto, {
      FORM_ID: 'formId',
      CENTRO_ID: 'centroId',
      fields: 'fields',
    });
  }

  private toCentroFilter(filterDto: CentroFilterDto) {
    return mapProps(filterDto, {
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

  @Post()
  @ApiOperation({ summary: 'Create a new resource' })
  create(@Body() createDto: CreateDto) {
    return this.service.create(this.toCreateInput(createDto));
  }

  @Get()
  findAll(@Query(ValidationPipe) filterDto: FilterDto): Promise<Regional[]> {
    return this.service.findAll(this.toFilter(filterDto));
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Regional> {
    return this.service.findOne(id);
  }

  @Get(':id/summaries')
  async findSummaries(@Param('id') id: string, @Query(ValidationPipe) filterDto: SummaryFilterDto): Promise<Summary[]> {
    return await this.service.findSummaries(id, this.toSummaryFilter(filterDto));
  }

  @Get(':id/centros')
  async findCentros(@Param('id') id: string, @Query(ValidationPipe) filterDto: CentroFilterDto): Promise<Centro[]> {
    return await this.service.findCentros(id, this.toCentroFilter(filterDto));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateRegionalDto) {
    return this.service.update(id, this.toUpdateInput(updateDto));
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
