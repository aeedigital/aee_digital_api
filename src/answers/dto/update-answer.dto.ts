import { IsString, IsOptional } from 'class-validator';

export class UpdateDto {
  @IsOptional()
  @IsString()
  QUESTION_ID: string;
  @IsOptional()
  @IsString()
  CENTRO_ID: boolean;
  @IsOptional()
  @IsString()
  ANSWER: string;
  @IsOptional()
  @IsString()
  QUIZ_ID: string;
}
