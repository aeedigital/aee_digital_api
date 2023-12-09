import { isString, IsOptional, IsString } from 'class-validator';

export class FilterDto {
  @IsString()
  @IsOptional()
  fields?: string;
}
