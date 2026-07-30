import { Pass } from '../entities/pass';
import { CrudRepository } from './crud.repository';

export type PassFilter = Record<string, any>;

export interface CreatePassInput {
  user: string;
  pass: string;
  scopeId: string;
  groups: string[];
  lastLogged?: Date | null;
}

export interface UpdatePassInput extends Partial<CreatePassInput> {}

export interface PassRepository
  extends CrudRepository<Pass, CreatePassInput, UpdatePassInput, PassFilter> {}
