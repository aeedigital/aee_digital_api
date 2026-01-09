import { Summary } from '../entities/summary';
import { CrudRepository } from './crud.repository';

export type SummaryFilter = Record<string, any>;

export interface SummaryQuestionInput {
  answer: string;
  questionId: string;
}

export interface CreateSummaryInput {
  formId: string;
  centroId: string;
  questions: SummaryQuestionInput[];
  validatedByCoordAt?: Date;
}

export interface UpdateSummaryInput extends Partial<CreateSummaryInput> {}

export interface SummaryRepository
  extends CrudRepository<Summary, CreateSummaryInput, UpdateSummaryInput, SummaryFilter> {}
