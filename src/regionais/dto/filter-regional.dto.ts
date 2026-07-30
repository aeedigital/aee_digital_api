import { IsString, IsOptional } from 'class-validator';
import { BaseFilterDto } from '../../base/dto/base-filter.dto';

export class FilterDto extends BaseFilterDto {
  @IsString()
  @IsOptional()
  NOME_REGIONAL?: string;

  @IsString()
  @IsOptional()
  PAIS?: string;

  @IsString()
  @IsOptional()
  COORDENADOR_ID: string;

  // Adicione outros campos de filtro, se necessário
}
