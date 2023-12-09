import { IsString, IsOptional } from 'class-validator';

// import { CreateQuestionsDto } from '../../questions/dto/create-questions.dto';
import { ApiProperty } from '@nestjs/swagger';

class groupQuestionDto {
  @ApiProperty({ type: () => [String] })
  GROUP: [string];
  @ApiProperty()
  IS_MULTIPLE: boolean;
}

class QuizDto {
  @ApiProperty()
  CATEGORY: string;
  @ApiProperty({ type: () => [groupQuestionDto] })
  QUESTIONS: [groupQuestionDto];
}

class PagesDto {
  @ApiProperty()
  NAME: string;
  @ApiProperty({ type: () => [QuizDto] })
  QUIZES: [QuizDto];
}

export class CreateFormDto {
  @ApiProperty()
  NAME: string;
  @ApiProperty()
  VERSION: number;
  @ApiProperty()
  CREATEDBY: string;
  @ApiProperty({ type: () => [PagesDto] })
  PAGES: [PagesDto];
}
