import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class FuncionamentoDto {
  @IsString()
  @ApiProperty()
  segunda: string[];
  @IsString()
  @ApiProperty()
  terca: string[];
  @IsString()
  @ApiProperty()
  quarta: string[];
  @IsString()
  @ApiProperty()
  quinta: string[];
  @IsString()
  @ApiProperty()
  sexta: string[];
  @IsString()
  @ApiProperty()
  sabado: string[];
  @IsString()
  @ApiProperty()
  domingo: string[];
}

export class CreateCentroDto {
  @IsNotEmpty()
  @ApiProperty()
  FUNCIONAMENTO: FuncionamentoDto;
  @IsNotEmpty()
  @ApiProperty()
  NOME_CENTRO: string;
  @IsNotEmpty()
  @ApiProperty()
  NOME_CURTO: string;
  @IsNotEmpty()
  @ApiProperty()
  CNPJ_CENTRO: string;
  @IsNotEmpty()
  @ApiProperty()
  DATA_FUNDACAO: string;
  @IsNotEmpty()
  @ApiProperty()
  REGIONAL: string;
  @IsNotEmpty()
  @ApiProperty()
  ENDERECO: string;
  @IsNotEmpty()
  @ApiProperty()
  CEP: string;
  @IsNotEmpty()
  @ApiProperty()
  BAIRRO: string;
  @IsNotEmpty()
  @ApiProperty()
  CIDADE: string;
  @IsNotEmpty()
  @ApiProperty()
  ESTADO: string;
  @IsNotEmpty()
  @ApiProperty()
  PAIS: string;
}
