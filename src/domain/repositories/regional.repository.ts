import { Regional } from '../entities/regional';

export type RegionalFilter = Record<string, any>;

export interface CreateRegionalInput {
  nomeRegional: string;
  pais: string;
  coordenadorId: string;
}

export interface UpdateRegionalInput extends Partial<CreateRegionalInput> {}

export interface RegionalRepository {
  create(data: CreateRegionalInput): Promise<Regional>;
  findAll(filter?: RegionalFilter): Promise<Regional[]>;
  findById(id: string): Promise<Regional | null>;
  update(id: string, data: UpdateRegionalInput): Promise<Regional>;
  updateOrCreate(
    filter: Partial<RegionalFilter> & { id?: string },
    data: CreateRegionalInput,
  ): Promise<Regional>;
  delete(id: string): Promise<void>;
}
