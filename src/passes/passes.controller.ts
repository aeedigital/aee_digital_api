import { Controller } from '@nestjs/common';
import { GenericController } from '../base/generic.controller';
import { PassesService } from './passes.service';
import { Passes } from './schemas/passes.schema';
import { FilterDto } from './dto/filter-passes.dto';
import { CreatePassesDto } from './dto/create-passes.dto';

@Controller('api/v1/passes')
export class PassesController extends GenericController<
  CreatePassesDto,
  FilterDto,
  Passes
> {
  constructor(private readonly passesService: PassesService) {
    super(passesService);
  }
}
