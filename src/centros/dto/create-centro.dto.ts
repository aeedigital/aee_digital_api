import { IsNotEmpty, IsString } from 'class-validator';

export class FuncionamentoDto {
  segunda: string[];
  terca: string[];
  quarta: string[];
  quinta: string[];
  sexta: string[];
  sabado: string[];
  domingo: string[];
}


export class CreateCentroDto {
  FUNCIONAMENTO: FuncionamentoDto;
  NOME_CENTRO: string;
  NOME_CURTO: string;
  CNPJ_CENTRO: string;
  DATA_FUNDACAO: string;
  REGIONAL: string;
  ENDERECO: string;
  CEP: string;
  BAIRRO: string;
  CIDADE: string;
  ESTADO: string;
  PAIS: string;
}
