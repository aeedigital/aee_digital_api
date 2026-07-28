import { IsOptional, IsString, IsNumberString } from 'class-validator';

export class CentrosWithAnswersQueryDto {
  @IsOptional()
  @IsString()
  dateFrom?: string;

  @IsOptional()
  @IsString()
  dateTo?: string;

  @IsOptional()
  @IsString()
  fields?: string;

  @IsOptional()
  @IsString()
  include?: string; // answers,summaries

  @IsOptional()
  @IsNumberString()
  limitSummaries?: string;

  @IsOptional()
  @IsString()
  sortBy?: string; // e.g., updatedAt:desc
}
