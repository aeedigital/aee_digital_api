import { IsString, IsOptional } from 'class-validator';

export class CreatePassesDto {
  user: string;
  pass: string;
  scope_id: string;
  groups: string[];
}
