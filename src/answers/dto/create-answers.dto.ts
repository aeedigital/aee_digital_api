import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateAnswersDto {
  @ApiProperty()
  @IsString()
  QUESTION_ID: string;
  @ApiProperty()
  @IsOptional()
  @IsString()
  QUIZ_ID: string;
  @ApiProperty()
  @IsString()
  CENTRO_ID: string;
  @ApiProperty()
  @IsString()
  ANSWER: string;

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
