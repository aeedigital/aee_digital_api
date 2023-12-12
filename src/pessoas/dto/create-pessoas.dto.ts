import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEmail } from 'class-validator';

export class CreatePessoasDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  NOME: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsEmail()
  'E-MAIL': string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  CELULAR: string;
}
