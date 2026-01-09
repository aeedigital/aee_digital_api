import { IsOptional, IsString } from 'class-validator';

export class BaseFilterDto {
  @IsString()
  @IsOptional()
  fields?: string;
}
