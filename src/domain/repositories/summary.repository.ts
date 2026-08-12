import {
  Summary,
  SummaryAttendance,
  SummaryFormSnapshot,
  SummaryQuestion,
  SummaryReconstruction,
} from '../entities/summary';
import { CrudRepository } from './crud.repository';

export type SummaryFilter = {
  formId?: string;
  centroId?: string;
  fields?: string;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  skip?: number;
  sort?: Record<string, 1 | -1>;
};

export type SummaryStatsParams = {
  dateFrom: Date;
  dateTo: Date;
  status?: string[];
};

export type SummaryStatsResult = {
  eventsByDay: Record<string, number>;
  respondedCount: number;
  totalCentros: number;
};

export type SummaryManyFilter = {
  centroIds: string[];
  dateFrom?: Date;
  dateTo?: Date;
  fields?: string;
  sort?: Record<string, 1 | -1>;
};

export interface SummaryQuestionInput {
  answer: string;
  questionId: string;
  answerId?: string;
  groupKey?: string;
  groupInstanceId?: string;
  occurrenceOrder?: number;
  questionOrder?: number;
  questionLabel?: string;
  answerType?: string;
}

export interface CreateSummaryInput {
  formId: string;
  centroId: string;
  questions: SummaryQuestionInput[];
  validatedByCoordAt?: Date;
  schemaVersion?: number;
  formSnapshot?: SummaryFormSnapshot;
  coordinationSnapshot?: SummaryFormSnapshot;
  attendance?: SummaryAttendance;
  publicationAuthorized?: boolean;
  reconstruction?: SummaryReconstruction;
}

export interface UpdateSummaryInput extends Partial<CreateSummaryInput> {}

export interface SummaryRepository
  extends CrudRepository<Summary, CreateSummaryInput, UpdateSummaryInput, SummaryFilter> {
  stats(params: SummaryStatsParams): Promise<SummaryStatsResult>;
  findByCentroIds(filter: SummaryManyFilter): Promise<Summary[]>;
  findLatestByCentroIds(filter: SummaryManyFilter): Promise<Summary[]>;
}
