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
  @IsOptional()
  @IsString()
  FORM_ID?: string;
  @IsOptional()
  @IsString()
  GROUP_KEY?: string;
  @IsOptional()
  @IsString()
  GROUP_INSTANCE_ID?: string;
}
