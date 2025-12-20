export interface Funcionamento {
  segunda: string[];
  terca: string[];
  quarta: string[];
  quinta: string[];
  sexta: string[];
  sabado: string[];
  domingo: string[];
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
  createdAt?: Date;
  updatedAt?: Date;
}
