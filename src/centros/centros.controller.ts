import { Controller } from '@nestjs/common';
import { GenericController } from '../base/generic.controller';
import { CentrosService } from './centros.service';
import { CentroDocument } from './schemas/centro.schema';
import { FilterDto } from './dto/filter-centro.dto'

@Controller('api/v1/centros')
export class CentrosController extends GenericController<
  CentroDocument,
  FilterDto
> {
  constructor(private readonly centrosService: CentrosService) {
    super(centrosService);
  }
}
