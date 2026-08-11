import { Regional } from '../entities/regional';
import { CrudRepository } from './crud.repository';

export type RegionalFilter = Record<string, any>;

export interface CreateRegionalInput {
  nomeRegional: string;
  pais: string;
  coordenadorId: string;
}

export interface UpdateRegionalInput extends Partial<CreateRegionalInput> {}

export type RegionalOverviewExcludeRule = {
  questionId: string;
  answers: string[];
  summarySelection: 'latest';
  matchMode: 'trim-case-insensitive';
};

export type RegionalOverviewFilter = {
  dateFrom?: Date;
  dateTo?: Date;
  status?: string[];
  excludeRule?: RegionalOverviewExcludeRule;
};

export type RegionalOverviewItem = {
  id: string;
  nomeRegional: string;
  pais: string;
  centrosCount: number;
  finalizadosCount: number;
};

export interface RegionalRepository
  extends CrudRepository<Regional, CreateRegionalInput, UpdateRegionalInput, RegionalFilter> {
  overview(filter: RegionalOverviewFilter): Promise<RegionalOverviewItem[]>;
  overviewBase(): Promise<RegionalOverviewItem[]>;
}
