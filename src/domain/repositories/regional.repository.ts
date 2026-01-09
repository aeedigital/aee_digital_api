import { Regional } from '../entities/regional';
import { CrudRepository } from './crud.repository';

export type RegionalFilter = Record<string, any>;

export interface CreateRegionalInput {
  nomeRegional: string;
  pais: string;
  coordenadorId: string;
}

export interface UpdateRegionalInput extends Partial<CreateRegionalInput> {}

export interface RegionalRepository
  extends CrudRepository<Regional, CreateRegionalInput, UpdateRegionalInput, RegionalFilter> {}
