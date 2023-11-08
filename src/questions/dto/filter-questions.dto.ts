import { IsString, IsOptional } from 'class-validator';

export class FilterDto {
  @IsString()
  @IsOptional()
  NOME_CENTRO?: string;

  @IsString()
  @IsOptional()
  NOME_CURTO?: string;

  @IsString()
  @IsOptional()
  fields?: string;

  // Adicione outros campos de filtro, se necessário
}
