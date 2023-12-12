import { IsString, IsOptional, IsEmail } from 'class-validator';

export class FilterDto {
  @IsString()
  @IsOptional()
  NOME?: string;

  @IsEmail()
  @IsOptional()
  'E-MAIL'?: string;

  @IsEmail()
  @IsOptional()
  CELULAR?: string;

  @IsString()
  @IsOptional()
  fields?: string;

  // Adicione outros campos de filtro, se necessário
}
