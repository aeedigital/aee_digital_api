import { IsInt, IsString, IsOptional, Min } from 'class-validator';

export class UpdateDto {
  @IsOptional()
  @IsString()
  QUESTION_ID: string;
  @IsOptional()
  @IsString()
  CENTRO_ID: string;
  @IsOptional()
  @IsString()
  ANSWER: string;
  @IsOptional()
  @IsString()
  QUIZ_ID: string;

  @IsOptional()
  @IsString()
  FORM_ID?: string;

  @IsOptional()
  @IsString()
  GROUP_KEY?: string;

  @IsOptional()
  @IsString()
  GROUP_INSTANCE_ID?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  GROUP_OCCURRENCE_ORDER?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  QUESTION_ORDER?: number;
}
