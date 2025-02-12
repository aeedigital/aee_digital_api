// update-passes.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreatePassesDto } from './create-passes.dto';

export class UpdatePassesDto extends PartialType(CreatePassesDto) {}