import { Pass } from '../entities/pass';

export type PassFilter = Record<string, any>;

export interface CreatePassInput {
  user: string;
  pass: string;
  scopeId: string;
  groups: string[];
  lastLogged?: Date | null;
}

export interface UpdatePassInput extends Partial<CreatePassInput> {}

export interface PassRepository {
  create(data: CreatePassInput): Promise<Pass>;
  findAll(filter?: PassFilter): Promise<Pass[]>;
  findById(id: string): Promise<Pass | null>;
  update(id: string, data: UpdatePassInput): Promise<Pass>;
  updateOrCreate(
    filter: Partial<PassFilter> & { id?: string },
    data: CreatePassInput,
  ): Promise<Pass>;
  delete(id: string): Promise<void>;
}
