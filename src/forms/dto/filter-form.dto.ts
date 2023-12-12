import { IsString, IsOptional } from 'class-validator';

export class FilterDto {
  @IsString()
  @IsOptional()
  user?: string;

  @IsString()
  @IsOptional()
  pass?: string;

  @IsString()
  @IsOptional()
  scope_id?: string;

  @IsString()
  @IsOptional()
  fields?: string;
}
