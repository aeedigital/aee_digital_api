import { Centro, CentroLocation } from '../entities/centro';
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
  location?: CentroLocation;
}

export interface UpdateCentroInput extends Partial<CreateCentroInput> {}

export type CentroAddress = Pick<
  Centro,
  'endereco' | 'cep' | 'bairro' | 'cidade' | 'estado' | 'pais'
>;

export interface SaveCentroLocationInput extends Omit<CentroLocation, 'updatedAt'> {
  addressHash: string;
}

export interface CentroRepository
  extends CrudRepository<Centro, CreateCentroInput, UpdateCentroInput, CentroFilter> {
  saveLocation(
    id: string,
    expectedAddress: CentroAddress,
    location: CentroLocation,
  ): Promise<Centro>;
}
