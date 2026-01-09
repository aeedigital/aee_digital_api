import { IsOptional, IsString } from 'class-validator';
import { BaseFilterDto } from '../../base/dto/base-filter.dto';

export class FilterDto extends BaseFilterDto {
  @IsString()
  @IsOptional()
  FORM_ID?: string;

  @IsString()
  @IsOptional()
  CENTRO_ID?: string;
}
