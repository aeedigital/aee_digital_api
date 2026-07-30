import { IsString, IsOptional, IsNumberString } from 'class-validator';
import { BaseFilterDto } from '../../base/dto/base-filter.dto';

export class FilterDto extends BaseFilterDto {
  @IsString()
  @IsOptional()
  NAME: string;

  @IsNumberString()
  @IsOptional()
  VERSION: number;
  
  @IsString()
  @IsOptional()
  CREATEDBY: string;
}
