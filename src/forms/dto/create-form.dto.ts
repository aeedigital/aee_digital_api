import { IsString, IsOptional } from 'class-validator';

import { CreateQuestionDto } from '../../questions/dto/create-question.dto';

export class CreateFormDto {
  NAME: string;
  VERSION: number;
  CREATEDAT: Date;
  CREATEDBY: string;
  PAGES: [
    {
      NAME: string;
      QUIZES: [
        {
          CATEGORY: string;
          QUESTIONS: [
            {
              GROUP: [CreateQuestionDto];
              IS_MULTIPLE: boolean;
            },
          ];
        },
      ];
    },
  ];
}
