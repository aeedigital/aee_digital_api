export interface Funcionamento {
  segunda: string[];
  terca: string[];
  quarta: string[];
  quinta: string[];
  sexta: string[];
  sabado: string[];
  domingo: string[];
}

export type CentroLocationStatus =
  | 'CONFIRMADA'
  | 'APROXIMADA'
  | 'PENDENTE'
  | 'NAO_ENCONTRADA'
  | 'ERRO';

export interface CentroLocation {
  latitude?: number;
  longitude?: number;
  status: CentroLocationStatus;
  precision?: string;
  confidence?: number;
  origin?: string;
  placeId?: string;
  formattedAddress?: string;
  updatedAt?: Date;
  addressHash?: string;
  errorCode?: string;
}

export interface Centro {
  id: string;
  funcionamento: Funcionamento;
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
  createdAt?: Date;
  updatedAt?: Date;
}
