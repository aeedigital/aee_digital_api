import { Centro } from '../entities/centro';
import { CrudRepository } from './crud.repository';

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

export interface CentroRepository
  extends CrudRepository<Centro, CreateCentroInput, UpdateCentroInput, CentroFilter> {}
