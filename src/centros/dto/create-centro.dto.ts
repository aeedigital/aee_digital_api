import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCentroDto {
  @IsNotEmpty()
  @IsString()
  NOME_CENTRO: string;

  @IsNotEmpty()
  @IsString()
  NOME_CURTO: string;
}
