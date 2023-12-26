import { IsString, IsOptional, IsNumberString } from 'class-validator';

export class FilterDto {
  @IsString()
  @IsOptional()
  NAME: string;

  @IsNumberString()
  @IsOptional()
  VERSION: number;
  
  @IsString()
  @IsOptional()
  CREATEDBY: string;

  @IsString()
  @IsOptional()
  fields?: string;
}
