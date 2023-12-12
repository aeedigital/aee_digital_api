import { IsOptional, IsString } from 'class-validator';

export class FilterDto {
  @IsString()
  @IsOptional()
  FORM_ID?: string;

  @IsString()
  @IsOptional()
  CENTRO_ID?: string;

  @IsString()
  @IsOptional()
  fields?: string;
}
