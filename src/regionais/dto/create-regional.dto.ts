import { IsString, IsOptional } from 'class-validator';

export class CreateRegionalDto {
  NOME_REGIONAL: string;
  ESTADO: string;
  PAIS: string;
  COORDENADOR_ID: string;
}
