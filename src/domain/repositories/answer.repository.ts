import { Answer } from '../entities/answer';
import { CrudRepository } from './crud.repository';

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

export interface AnswerRepository
  extends CrudRepository<Answer, CreateAnswerInput, UpdateAnswerInput, AnswerFilter> {}
