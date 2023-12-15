import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateAnswersDto {
  @ApiProperty()
  @IsString()
  QUESTION_ID: string;
  @ApiProperty()
  @IsString()
  QUIZ_ID: string;
  @ApiProperty()
  @IsString()
  CENTRO_ID: boolean;
  @ApiProperty()
  @IsString()
  ANSWER: string;
}
