import { CadastroInfo } from '../entities/cadastro-info';
import { CrudRepository } from './crud.repository';

export type CadastroInfoFilter = {
  startDate?: string;
  endDate?: string;
  formId?: string;
  cycleId?: string;
  isActive?: boolean;
  fields?: string;
};

export interface CreateCadastroInfoInput {
  startDate: string;
  endDate: string;
  formId: string;
  cycleId?: string;
  isActive: boolean;
  startNewCycle?: boolean;
}

export interface UpdateCadastroInfoInput extends Partial<CreateCadastroInfoInput> {}

export interface CadastroInfoRepository
  extends CrudRepository<
    CadastroInfo,
    CreateCadastroInfoInput,
    UpdateCadastroInfoInput,
    CadastroInfoFilter
  > {
  findActive(): Promise<CadastroInfo | null>;
}
