import { IsString, IsOptional } from 'class-validator';

import { CreateQuestionsDto } from '../../questions/dto/create-questions.dto';

export class CreateFormDto {
  NAME: string;
  VERSION: number;
  CREATEDBY: string;
  PAGES: [
    {
      NAME: string;
      QUIZES: [
        {
          CATEGORY: string;
          QUESTIONS: [
            {
              GROUP: [CreateQuestionsDto];
              IS_MULTIPLE: boolean;
            },
          ];
        },
      ];
    },
  ];
}
