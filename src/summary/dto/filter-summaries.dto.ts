import { IsOptional, IsString, IsNumberString } from 'class-validator';
import { BaseFilterDto } from '../../base/dto/base-filter.dto';

export class FilterDto extends BaseFilterDto {
  @IsString()
  @IsOptional()
  FORM_ID?: string;

  @IsString()
  @IsOptional()
  CENTRO_ID?: string;

  @IsString()
  @IsOptional()
  dateFrom?: string; // ISO yyyy-mm-dd

  @IsString()
  @IsOptional()
  dateTo?: string; // ISO yyyy-mm-dd

  @IsOptional()
  @IsNumberString()
  limit?: string;

  @IsOptional()
  @IsNumberString()
  skip?: string;

  @IsOptional()
  @IsString()
  sort?: string; // e.g., updatedAt:-1
}
