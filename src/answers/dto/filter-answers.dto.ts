import { IsString, IsOptional } from 'class-validator';
import { BaseFilterDto } from '../../base/dto/base-filter.dto';

export class FilterDto extends BaseFilterDto {
  @IsOptional()
  @IsString()
  QUESTION_ID: string;
  @IsOptional()
  @IsString()
  CENTRO_ID: string;
  @IsOptional()
  @IsString()
  QUIZ_ID: string;
  @IsOptional()
  @IsString()
  ANSWER: string;
}
