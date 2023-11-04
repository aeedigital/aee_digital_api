import { IsString, IsOptional } from 'class-validator';

export class CreatePessoasDto {
  NOME: string;
  'E-MAIL': string;
  CELULAR: string;
}
