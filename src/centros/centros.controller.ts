import { Controller } from '@nestjs/common';
import { GenericController } from '../base/generic.controller';
import { CentrosService } from './centros.service';
import { Centro } from './schemas/centro.schema';
import { CreateCentroDto } from './dto/create-centro.dto';
import { FilterDto } from './dto/filter-centro.dto';

@Controller('api/v1/centros')
export class CentrosController extends GenericController<
  CreateCentroDto,
  FilterDto,
  Centro
> {
  constructor(private readonly centrosService: CentrosService) {
    super(centrosService);
  }
}
