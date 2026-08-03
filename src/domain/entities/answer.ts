export interface Answer {
  id: string;
  questionId: string;
  centroId: string;
  answer: string;
  quizId?: string;
  formId?: string;
  groupKey?: string;
  groupInstanceId?: string;
  groupOccurrenceOrder?: number;
  questionOrder?: number;
  createdAt?: Date;
  updatedAt?: Date;
}
