import { IsOptional, IsString } from 'class-validator';

export class CoordSummaryQueryDto {
  @IsOptional()
  @IsString()
  dateFrom?: string;

  @IsOptional()
  @IsString()
  dateTo?: string;
}
