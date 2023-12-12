import { IsString, IsOptional } from 'class-validator';

export class FilterDto {
  @IsString()
  @IsOptional()
  QUESTION?: string;

  @IsString()
  @IsOptional()
  ANSWER_TYPE?: string;

  @IsOptional()
  @IsString()
  IS_REQUIRED: boolean;

  @IsOptional()
  @IsString()
  IS_MULTIPLE: string;

  @IsString()
  @IsOptional()
  fields?: string;

  // Adicione outros campos de filtro, se necessário
}
