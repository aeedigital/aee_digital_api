import { IsString, IsOptional } from 'class-validator';

export class CreateQuestionsDto {
  QUESTION: string;
  ANSWER_TYPE: string;
  IS_REQUIRED: boolean;
  IS_MULTIPLE: string;
  PRESET_VALUES: string[];
}
