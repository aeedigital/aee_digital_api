import { Transform } from 'class-transformer';
import { IsString, IsOptional } from 'class-validator';
import { IsStringOrBoolean } from '../../common/stringorboolean.validator';

export class FilterDto {
  @IsString()
  @IsOptional()
  QUESTION?: string;

  @IsString()
  @IsOptional()
  ANSWER_TYPE?: string;

  @IsStringOrBoolean()
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toLowerCase() === 'true' : value,
  )
  IS_REQUIRED: boolean | string; 
  
  @IsStringOrBoolean()
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toLowerCase() === 'true' : value,
  )
  IS_MULTIPLE: boolean | string;

  @IsOptional()
  @IsString()
  ROLE: string;

  @IsString()
  @IsOptional()
  fields?: string;

  // Adicione outros campos de filtro, se necessário
}
