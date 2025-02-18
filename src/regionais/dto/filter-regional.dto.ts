import { IsString, IsOptional } from 'class-validator';

export class FilterDto {
  @IsString()
  @IsOptional()
  NOME_REGIONAL?: string;

  @IsString()
  @IsOptional()
  PAIS?: string;

  @IsString()
  @IsOptional()
  COORDENADOR_ID: string;

  @IsString()
  @IsOptional()
  fields?: string;

  // Adicione outros campos de filtro, se necessário
}
