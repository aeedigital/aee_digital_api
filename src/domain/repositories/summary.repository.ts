import { Summary } from '../entities/summary';

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

export interface SummaryRepository {
  create(data: CreateSummaryInput): Promise<Summary>;
  findAll(filter?: SummaryFilter): Promise<Summary[]>;
  findById(id: string): Promise<Summary | null>;
  update(id: string, data: UpdateSummaryInput): Promise<Summary>;
  updateOrCreate(
    filter: Partial<SummaryFilter> & { id?: string },
    data: CreateSummaryInput,
  ): Promise<Summary>;
  delete(id: string): Promise<void>;
}
