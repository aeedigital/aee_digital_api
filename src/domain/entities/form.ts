export interface FormQuestion {
  group: string[];
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
