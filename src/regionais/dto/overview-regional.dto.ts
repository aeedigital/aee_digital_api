import { IsOptional, IsString } from 'class-validator';

export class OverviewRegionalDto {
  @IsOptional()
  @IsString()
  dateFrom?: string; // ISO yyyy-mm-dd

  @IsOptional()
  @IsString()
  dateTo?: string; // ISO yyyy-mm-dd

  @IsOptional()
  @IsString()
  status?: string; // CSV list
}
