export interface SummaryQuestion {
  answer: string;
  questionId: string;
}

export interface Summary {
  id: string;
  formId: string;
  centroId: string;
  questions: SummaryQuestion[];
  validatedByCoordAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
