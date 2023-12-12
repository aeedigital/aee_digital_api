import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

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
  @IsString()
  groups: string[];
}
