import { IsString, IsOptional } from 'class-validator';

export class FilterDto {
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
  @IsString()
  @IsOptional()
  fields?: string;

  @IsOptional()
  @IsString()
  STATUS?: string;

  // Adicione outros campos de filtro, se necessário
}
