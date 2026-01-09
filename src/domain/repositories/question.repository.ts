import { QuestionEntity } from '../entities/question';
import { CrudRepository } from './crud.repository';

export type QuestionFilter = Record<string, any>;

export interface CreateQuestionInput {
  question: string;
  answerType: string;
  isRequired: boolean | string;
  isMultiple: boolean | string;
  presetValues: string[];
  role?: string;
}

export interface UpdateQuestionInput extends Partial<CreateQuestionInput> {}

export interface QuestionRepository
  extends CrudRepository<QuestionEntity, CreateQuestionInput, UpdateQuestionInput, QuestionFilter> {}
