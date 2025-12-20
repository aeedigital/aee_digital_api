import { QuestionEntity } from '../entities/question';

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

export interface QuestionRepository {
  create(data: CreateQuestionInput): Promise<QuestionEntity>;
  findAll(filter?: QuestionFilter): Promise<QuestionEntity[]>;
  findById(id: string): Promise<QuestionEntity | null>;
  update(id: string, data: UpdateQuestionInput): Promise<QuestionEntity>;
  updateOrCreate(
    filter: Partial<QuestionFilter> & { id?: string },
    data: CreateQuestionInput,
  ): Promise<QuestionEntity>;
  delete(id: string): Promise<void>;
}
