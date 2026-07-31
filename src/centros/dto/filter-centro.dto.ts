import { IsString, IsOptional } from 'class-validator';
import { BaseFilterDto } from '../../base/dto/base-filter.dto';

export class FilterDto extends BaseFilterDto {
  @IsOptional()
  @IsString()
  NOME_CENTRO?: string;
  @IsOptional()
  @IsString()
  NOME_CURTO?: string;
  @IsOptional()
  @IsString()
  CNPJ_CENTRO?: string;
  @IsOptional()
  @IsString()
  DATA_FUNDACAO?: string;
  @IsOptional()
  @IsString()
  REGIONAL?: string;
  @IsOptional()
  @IsString()
  ENDERECO?: string;
  @IsOptional()
  @IsString()
  CEP?: string;
  @IsOptional()
  @IsString()
  BAIRRO?: string;
  @IsOptional()
  @IsString()
  CIDADE?: string;
  @IsOptional()
  @IsString()
  ESTADO?: string;
  @IsOptional()
  @IsString()
  PAIS?: string;

  @IsOptional()
  @IsString()
  STATUS?: string;

}
