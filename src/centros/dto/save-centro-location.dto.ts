import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDefined,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { LocationStatus } from '../schemas/centro.schema';

const LOCATION_STATUSES: LocationStatus[] = [
  'CONFIRMADA',
  'APROXIMADA',
  'PENDENTE',
  'NAO_ENCONTRADA',
  'ERRO',
];

function hasCoordinates(status?: LocationStatus): boolean {
  return status === 'CONFIRMADA' || status === 'APROXIMADA';
}

export class SaveCentroLocationDto {
  @IsString()
  @Matches(/^[a-f0-9]{64}$/)
  @ApiProperty({ description: 'Hash SHA-256 normalizado do endereço consultado' })
  ENDERECO_HASH: string;

  @IsIn(LOCATION_STATUSES)
  @ApiProperty({ enum: LOCATION_STATUSES })
  STATUS: LocationStatus;

  @ValidateIf((payload: SaveCentroLocationDto) => hasCoordinates(payload.STATUS))
  @IsDefined()
  @IsNumber()
  @Min(-90)
  @Max(90)
  @ApiPropertyOptional()
  LATITUDE?: number;

  @ValidateIf((payload: SaveCentroLocationDto) => hasCoordinates(payload.STATUS))
  @IsDefined()
  @IsNumber()
  @Min(-180)
  @Max(180)
  @ApiPropertyOptional()
  LONGITUDE?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @ApiPropertyOptional()
  PRECISAO?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  @ApiPropertyOptional()
  CONFIANCA?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @ApiPropertyOptional()
  ORIGEM?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @ApiPropertyOptional()
  PLACE_ID?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @ApiPropertyOptional()
  ENDERECO_FORMATADO?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @ApiPropertyOptional()
  ERRO_CODIGO?: string;
}
