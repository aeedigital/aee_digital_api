import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsArray } from 'class-validator';

export class SummaryQuestion {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  ANSWER: string;

  @ApiProperty()
  @IsNotEmpty()
  QUESTION: string;
}

export class CreateSummariesDto {
  @ApiProperty()
  @IsNotEmpty()
  FORM_ID: string;

  @ApiProperty()
  @IsNotEmpty()
  CENTRO_ID: string;

  @ApiProperty({ type: [SummaryQuestion] })
  @IsNotEmpty()
  @IsArray()
  QUESTIONS: [SummaryQuestion];

  @ApiProperty()
  validatedByCoordAt?: Date;

}
