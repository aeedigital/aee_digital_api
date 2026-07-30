export interface QuestionEntity {
  id: string;
  question: string;
  answerType: string;
  isRequired: boolean | string;
  isMultiple: boolean | string;
  presetValues: string[];
  role?: string;
}
