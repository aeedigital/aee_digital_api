export interface FormQuestionGroup {
  id: string;
  question?: string;
  answerType?: string;
  isRequired?: boolean;
  isMultiple?: boolean | string;
  presetValues?: string[];
  role?: string;
}

export interface FormQuestion {
  // When populated, entries include question details; otherwise they may be ids.
  group: Array<string | FormQuestionGroup>;
  isMultiple: boolean;
}

export interface FormQuiz {
  category: string;
  questions: FormQuestion[];
}

export interface FormPage {
  name: string;
  role?: string;
  quizes: FormQuiz[];
}

export interface Form {
  id: string;
  name: string;
  version: number;
  createdBy: string;
  pages: FormPage[];
  createdAt?: Date;
  updatedAt?: Date;
}
