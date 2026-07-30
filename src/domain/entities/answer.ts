export interface Answer {
  id: string;
  questionId: string;
  centroId: string;
  answer: string;
  quizId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
