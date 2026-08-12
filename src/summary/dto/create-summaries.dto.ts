import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsArray, IsInt, IsOptional, Min } from 'class-validator';

export class SummaryQuestion {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  ANSWER: string;

  @ApiProperty()
  @IsNotEmpty()
  QUESTION: string;

  @IsOptional()
  @IsString()
  ANSWER_ID?: string;
  @IsOptional()
  @IsString()
  GROUP_KEY?: string;
  @IsOptional()
  @IsString()
  GROUP_INSTANCE_ID?: string;
  @IsOptional()
  @IsInt()
  @Min(0)
  OCCURRENCE_ORDER?: number;
  @IsOptional()
  @IsInt()
  @Min(0)
  QUESTION_ORDER?: number;
}

export class CreateSummariesDto {
  @ApiProperty()
  @IsNotEmpty()
  FORM_ID: string;

  @ApiProperty()
  @IsNotEmpty()
  CENTRO_ID: string;

  @ApiProperty({ type: [SummaryQuestion] })
  @IsOptional()
  @IsArray()
  QUESTIONS?: SummaryQuestion[];

  @ApiProperty()
  validatedByCoordAt?: Date;

}
