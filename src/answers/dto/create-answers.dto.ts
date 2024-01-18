import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

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
  CENTRO_ID: boolean;
  @ApiProperty()
  @IsString()
  ANSWER: string;
}
