import { IsString, IsOptional } from 'class-validator';
import { BaseFilterDto } from '../../base/dto/base-filter.dto';

export class FilterDto extends BaseFilterDto {
  @IsString()
  @IsOptional()
  NOME_CENTRO?: string;

  @IsString()
  @IsOptional()
  NOME_CURTO?: string;

  // Adicione outros campos de filtro, se necessário
}
