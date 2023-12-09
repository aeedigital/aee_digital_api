import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CreatePassesDto {
  @ApiProperty()
  user: string;
  @ApiProperty()
  pass: string;
  @ApiProperty()
  scope_id: string;
  @ApiProperty()
  groups: string[];
}
