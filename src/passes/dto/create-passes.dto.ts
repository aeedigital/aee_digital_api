import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class CreatePassesDto {
  @ApiProperty()
  @IsString()
  user: string;
  @ApiProperty()
  @IsString()
  pass: string;
  @ApiProperty()
  @IsString()
  scope_id: string;
  @ApiProperty()
  @IsArray() // Valida que o campo é um array
  @IsString({ each: true }) // Valida que cada elemento do array é uma string
  groups: string[];
  @ApiProperty()
  lastLogged: Date;
}
