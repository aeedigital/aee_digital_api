import { RegionaisAppService as Service } from '../application/regionais/regionais.service';
import { Regional } from '../domain/entities/regional';
import { FilterDto } from './dto/filter-regional.dto';
import { CreateRegionalDto as CreateDto } from './dto/create-regional.dto';

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

@Controller('regionais')
export class RegionaisController {
  constructor(private readonly service: Service) {}

  private toFilter(filterDto: FilterDto) {
    return {
      nomeRegional: filterDto.NOME_REGIONAL,
      pais: filterDto.PAIS,
      coordenadorId: filterDto.COORDENADOR_ID,
      fields: filterDto.fields,
    };
  }

  private toInput(dto: CreateDto | UpdateRegionalDto) {
    return {
      nomeRegional: dto.NOME_REGIONAL,
      pais: dto.PAIS,
      coordenadorId: dto.COORDENADOR_ID,
    };
  }

  private toSummaryFilter(filterDto: SummaryFilterDto) {
    return {
      formId: filterDto.FORM_ID,
      centroId: filterDto.CENTRO_ID,
      fields: filterDto.fields,
    };
  }

  private toCentroFilter(filterDto: CentroFilterDto) {
    return {
      nomeCentro: filterDto.NOME_CENTRO,
      nomeCurto: filterDto.NOME_CURTO,
      cnpjCentro: filterDto.CNPJ_CENTRO,
      dataFundacao: filterDto.DATA_FUNDACAO,
      regional: filterDto.REGIONAL,
      endereco: filterDto.ENDERECO,
      cep: filterDto.CEP,
      bairro: filterDto.BAIRRO,
      cidade: filterDto.CIDADE,
      estado: filterDto.ESTADO,
      pais: filterDto.PAIS,
      fields: filterDto.fields,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new resource' })
  create(@Body() createDto: CreateDto) {
    return this.service.create(this.toInput(createDto));
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
    return this.service.update(id, this.toInput(updateDto));
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
