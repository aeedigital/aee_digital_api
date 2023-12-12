import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateQuestionsDto {
  @ApiProperty()
  @IsString()
  QUESTION: string;
  @ApiProperty()
  @IsString()
  ANSWER_TYPE: string;
  @ApiProperty()
  @IsString()
  IS_REQUIRED: boolean;
  @ApiProperty()
  @IsString()
  IS_MULTIPLE: string;
  @ApiProperty()
  @IsString()
  PRESET_VALUES: string[];
}
