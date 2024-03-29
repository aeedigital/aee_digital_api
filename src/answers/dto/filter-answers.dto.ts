import { IsString, IsOptional } from 'class-validator';

export class FilterDto {
  @IsOptional()
  @IsString()
  QUESTION_ID: string;
  @IsOptional()
  @IsString()
  CENTRO_ID: string;
  @IsOptional()
  @IsString()
  QUIZ_ID: string;
  @IsOptional()
  @IsString()
  ANSWER: string;

  @IsString()
  @IsOptional()
  fields?: string;
}
