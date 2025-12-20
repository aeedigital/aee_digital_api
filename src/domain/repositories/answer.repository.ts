import { Answer } from '../entities/answer';

export interface AnswerFilter {
  questionId?: string;
  centroId?: string;
  quizId?: string;
  answer?: string;
}

export interface CreateAnswerInput {
  questionId: string;
  centroId: string;
  answer: string;
  quizId?: string;
}

export interface UpdateAnswerInput {
  questionId?: string;
  centroId?: string;
  answer?: string;
  quizId?: string;
}

export interface AnswerRepository {
  create(data: CreateAnswerInput): Promise<Answer>;
  findAll(filter?: AnswerFilter): Promise<Answer[]>;
  findById(id: string): Promise<Answer | null>;
  update(id: string, data: UpdateAnswerInput): Promise<Answer>;
  updateOrCreate(
    filter: Partial<AnswerFilter> & { id?: string },
    data: CreateAnswerInput,
  ): Promise<Answer>;
  delete(id: string): Promise<void>;
}
