import { IsArray, IsOptional, IsString } from 'class-validator';

export class StatsSummariesDto {
  @IsString()
  dateFrom: string; // ISO yyyy-mm-dd

  @IsString()
  dateTo: string; // ISO yyyy-mm-dd

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  status?: string[];
}
