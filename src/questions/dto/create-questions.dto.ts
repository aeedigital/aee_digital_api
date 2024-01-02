import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray } from 'class-validator';

import { IsStringOrBoolean } from '../../common/stringorboolean.validator';
import { Transform } from 'class-transformer';

export class CreateQuestionsDto {
  @ApiProperty()
  @IsString()
  QUESTION: string;
  @ApiProperty()
  @IsString()
  ANSWER_TYPE: string;
  @ApiProperty()
  @IsStringOrBoolean()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toLowerCase() === 'true' : value,
  )
  IS_REQUIRED: boolean | string;
  @ApiProperty()
  @IsStringOrBoolean()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toLowerCase() === 'true' : value,
  )
  IS_MULTIPLE: boolean | string;
  @ApiProperty({ type: [String] }) // Specify that the API property is an array of strings
  @IsArray()
  @IsString({ each: true }) // Validate that each element in the array is a string
  PRESET_VALUES: string[];
  @IsString()
  @IsOptional()
  ROLE: string;
}
