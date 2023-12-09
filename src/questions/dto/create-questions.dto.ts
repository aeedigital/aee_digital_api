import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CreateQuestionsDto {
  @ApiProperty()
  QUESTION: string;
  @ApiProperty()
  ANSWER_TYPE: string;
  @ApiProperty()
  IS_REQUIRED: boolean;
  @ApiProperty()
  IS_MULTIPLE: string;
  @ApiProperty()
  PRESET_VALUES: string[];
}
