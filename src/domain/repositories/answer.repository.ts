import { Answer } from '../entities/answer';
import { CrudRepository } from './crud.repository';

export interface AnswerFilter {
  questionId?: string;
  centroId?: string;
  quizId?: string;
  answer?: string;
  formId?: string;
  groupKey?: string;
  groupInstanceId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface CreateAnswerInput {
  questionId: string;
  centroId: string;
  answer: string;
  quizId?: string;
  formId?: string;
  groupKey?: string;
  groupInstanceId?: string;
  groupOccurrenceOrder?: number;
  questionOrder?: number;
}

export interface UpdateAnswerInput {
  questionId?: string;
  centroId?: string;
  answer?: string;
  quizId?: string;
  formId?: string;
  groupKey?: string;
  groupInstanceId?: string;
  groupOccurrenceOrder?: number;
  questionOrder?: number;
}

export type AnswerManyFilter = {
  centroIds: string[];
  dateFrom?: Date;
  dateTo?: Date;
  sortByUpdatedAt?: boolean;
};

export interface AnswerRepository
  extends CrudRepository<Answer, CreateAnswerInput, UpdateAnswerInput, AnswerFilter> {
  findByCentroIds(filter: AnswerManyFilter): Promise<Answer[]>;
}
