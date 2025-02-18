import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateRegionalDto {
  @ApiProperty()
  @IsString()
  NOME_REGIONAL: string;
  @ApiProperty()
  @IsString()
  PAIS: string;
  @ApiProperty()
  @IsString()
  COORDENADOR_ID: string;
}
