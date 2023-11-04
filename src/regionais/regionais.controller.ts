import { Controller } from '@nestjs/common';
import { GenericController } from '../base/generic.controller';
import { RegionalService } from './regionais.service';
import { Regional } from './schemas/regionais.schema';
import { FilterDto } from './dto/filter-regional.dto';
import { CreateRegionalDto } from './dto/create-regional.dto';

@Controller('api/v1/regionais')
export class RegionalController extends GenericController<
  CreateRegionalDto,
  FilterDto,
  Regional
> {
  constructor(private readonly regionalsService: RegionalService) {
    super(regionalsService);
  }
}
