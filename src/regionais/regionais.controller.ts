import { Controller } from '@nestjs/common';
import { GenericController } from '../base/generic.controller';
import { RegionalService } from './regionais.service';
import { RegionalDocument } from './schemas/regionais.schema';
import { FilterDto } from './dto/filter-regional.dto';

@Controller('api/v1/regionais')
export class RegionalController extends GenericController<
  RegionalDocument,
  FilterDto
> {
  constructor(private readonly centrosService: RegionalService) {
    super(centrosService);
  }
}
