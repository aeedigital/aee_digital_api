import { IsString, IsNotEmpty, IsEmail } from 'class-validator';

export class CreatePessoasDto {
  @IsNotEmpty()
  @IsString()
  NOME: string;
  @IsNotEmpty()
  @IsEmail()
  'E-MAIL': string;
  @IsNotEmpty()
  @IsString()
  CELULAR: string;
  _id: string;
}
