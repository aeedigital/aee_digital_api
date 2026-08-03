import { CentrosAppService as Service } from '../application/centros/centros.service';
import {
  CreateCentroInput,
  SaveCentroLocationInput,
  UpdateCentroInput,
} from '../domain/repositories/centro.repository';
import { CreateCentroDto as CreateDto } from './dto/create-centro.dto';
import { FilterDto } from './dto/filter-centro.dto';
import { SaveCentroLocationDto } from './dto/save-centro-location.dto';
import { UpdateCentroDto } from './dto/update-centro.dto';
import { FilterDto as SummaryFilterDto } from '../summary/dto/filter-summaries.dto';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { mapProps } from '../base/mappers/object.mapper';
import { toSummaryResponse } from '../summary/summary.presenter';
import { toCentroResponse } from './centro.presenter';
import { LocationUpdateTokenGuard } from './location/location-update-token.guard';
import { parseDateInput } from '../base/date-parse.helper';

const strictBodyValidation = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
});

@Controller('centros')
export class CentrosController {
  constructor(private readonly service: Service) {}

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

  private toUpdateInput(dto: UpdateCentroDto): UpdateCentroInput {
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

  private toSaveLocationInput(
    dto: SaveCentroLocationDto,
  ): SaveCentroLocationInput {
    return {
      addressHash: dto.ENDERECO_HASH,
      status: dto.STATUS,
      latitude: dto.LATITUDE,
      longitude: dto.LONGITUDE,
      precision: dto.PRECISAO,
      confidence: dto.CONFIANCA,
      origin: dto.ORIGEM,
      placeId: dto.PLACE_ID,
      formattedAddress: dto.ENDERECO_FORMATADO,
      errorCode: dto.ERRO_CODIGO,
    };
  }

  private toSummaryFilter(filterDto: SummaryFilterDto) {
    const sort = filterDto.sort && filterDto.sort.split(',').reduce((acc, part) => {
      const [field, direction] = part.split(':');
      if (field) acc[field] = direction === '-1' ? -1 : 1;
      return acc;
    }, {} as Record<string, 1 | -1>);
    return {
      formId: filterDto.FORM_ID,
      centroId: filterDto.CENTRO_ID,
      fields: filterDto.fields,
      dateFrom: parseDateInput(filterDto.dateFrom),
      dateTo: parseDateInput(filterDto.dateTo),
      limit: filterDto.limit ? parseInt(filterDto.limit, 10) : undefined,
      skip: filterDto.skip ? parseInt(filterDto.skip, 10) : undefined,
      ...(sort && Object.keys(sort).length ? { sort } : {}),
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new resource' })
  create(@Body(strictBodyValidation) createDto: CreateDto) {
    return this.service
      .create(this.toCreateInput(createDto))
      .then(toCentroResponse);
  }

  @Get()
  findAll(@Query(ValidationPipe) filterDto: FilterDto): Promise<any[]> {
    return this.service
      .findAll(this.toFilter(filterDto), {
        includeAttendance: filterDto.include === 'atendimento',
      })
      .then((items) => items.map(toCentroResponse));
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<any> {
    return this.service.findOne(id).then(toCentroResponse);
  }

  @Put(':id/localizacao')
  @UseGuards(LocationUpdateTokenGuard)
  @ApiOperation({
    summary: 'Salva a localização produzida pelo script operacional',
  })
  saveLocation(
    @Param('id') id: string,
    @Body(strictBodyValidation) locationDto: SaveCentroLocationDto,
  ) {
    return this.service
      .saveLocation(id, this.toSaveLocationInput(locationDto))
      .then(toCentroResponse);
  }

  @Get(':id/summaries')
  async findSummaries(
    @Param('id') id: string,
    @Query(ValidationPipe) filterDto: SummaryFilterDto,
  ): Promise<any[]> {
    const items = await this.service.findSummaries(
      id,
      this.toSummaryFilter(filterDto),
    );
    return items.map(toSummaryResponse);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(strictBodyValidation) updateDto: UpdateCentroDto,
  ) {
    return this.service
      .update(id, this.toUpdateInput(updateDto))
      .then(toCentroResponse);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
