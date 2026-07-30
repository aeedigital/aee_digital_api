import { IsString, IsOptional, IsEmail } from 'class-validator';
import { BaseFilterDto } from '../../base/dto/base-filter.dto';

export class FilterDto extends BaseFilterDto {
  @IsString()
  @IsOptional()
  NOME?: string;

  @IsEmail()
  @IsOptional()
  'E-MAIL'?: string;

  @IsEmail()
  @IsOptional()
  CELULAR?: string;

  // Adicione outros campos de filtro, se necessário
}
