import { Centro } from '../entities/centro';

export type CentroFilter = Record<string, any>;

export interface CreateCentroInput {
  funcionamento: Centro['funcionamento'];
  nomeCentro: string;
  nomeCurto: string;
  cnpjCentro: string;
  dataFundacao: string;
  regional: string;
  endereco: string;
  cep: string;
  bairro: string;
  cidade: string;
  estado: string;
  pais: string;
}

export interface UpdateCentroInput extends Partial<CreateCentroInput> {}

export interface CentroRepository {
  create(data: CreateCentroInput): Promise<Centro>;
  findAll(filter?: CentroFilter): Promise<Centro[]>;
  findById(id: string): Promise<Centro | null>;
  update(id: string, data: UpdateCentroInput): Promise<Centro>;
  updateOrCreate(
    filter: Partial<CentroFilter> & { id?: string },
    data: CreateCentroInput,
  ): Promise<Centro>;
  delete(id: string): Promise<void>;
}
