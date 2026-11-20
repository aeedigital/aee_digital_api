import { Centro, CentroLocation, SummarySourceVersion } from '../entities/centro';
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
  telefone?: string;
  site?: string;
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

export type CentroSummaryProfile = Partial<
  Pick<
    CreateCentroInput,
    'funcionamento' | 'endereco' | 'cep' | 'bairro' | 'cidade' | 'estado' | 'pais'
  >
> & {
  telefone?: string | null;
  site?: string | null;
};

export type { SummarySourceVersion };

export interface CentroRepository
  extends CrudRepository<Centro, CreateCentroInput, UpdateCentroInput, CentroFilter> {
  applySummaryProfileIfNewer(
    id: string,
    sourceVersion: SummarySourceVersion,
    profile: CentroSummaryProfile,
  ): Promise<boolean>;

  saveLocation(
    id: string,
    expectedAddress: CentroAddress,
    location: CentroLocation,
  ): Promise<Centro>;
}

export function isSummarySourceVersionNewer(
  candidate: SummarySourceVersion,
  current?: SummarySourceVersion,
): boolean {
  if (!current) return true;

  const updatedAtDifference =
    candidate.updatedAt.getTime() - current.updatedAt.getTime();
  if (updatedAtDifference !== 0) return updatedAtDifference > 0;

  const createdAtDifference =
    candidate.createdAt.getTime() - current.createdAt.getTime();
  if (createdAtDifference !== 0) return createdAtDifference > 0;

  return candidate.summaryId > current.summaryId;
}
