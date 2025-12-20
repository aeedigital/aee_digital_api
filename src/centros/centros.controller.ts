import { CentrosAppService as Service } from '../application/centros/centros.service';
import { Centro } from '../domain/entities/centro';

import { Summary } from '../domain/entities/summary';
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

  private toFilter(filterDto: FilterDto) {
    return {
      funcionamento: filterDto['FUNCIONAMENTO' as any],
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

  private toInput(dto: CreateDto) {
    return {
      funcionamento: dto.FUNCIONAMENTO,
      nomeCentro: dto.NOME_CENTRO,
      nomeCurto: dto.NOME_CURTO,
      cnpjCentro: dto.CNPJ_CENTRO,
      dataFundacao: dto.DATA_FUNDACAO,
      regional: dto.REGIONAL,
      endereco: dto.ENDERECO,
      cep: dto.CEP,
      bairro: dto.BAIRRO,
      cidade: dto.CIDADE,
      estado: dto.ESTADO,
      pais: dto.PAIS,
    };
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
    return this.service.create(this.toInput(createDto));
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
    return this.service.update(id, this.toInput(updateDto));
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
