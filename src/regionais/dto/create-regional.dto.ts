import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CreateRegionalDto {
  @ApiProperty()
  NOME_REGIONAL: string;
  @ApiProperty()
  ESTADO: string;
  @ApiProperty()
  PAIS: string;
  @ApiProperty()
  COORDENADOR_ID: string;
}
