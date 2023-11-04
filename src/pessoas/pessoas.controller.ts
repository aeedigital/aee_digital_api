import { Controller } from '@nestjs/common';
import { GenericController } from '../base/generic.controller';
import { PessoasService } from './pessoas.service';
import { Pessoas } from './schemas/pessoas.schema';
import { FilterDto } from './dto/filter-pessoas.dto';
import { CreatePessoasDto } from './dto/create-pessoas.dto';

@Controller('api/v1/pessoas')
export class PessoasController extends GenericController<
  CreatePessoasDto,
  FilterDto,
  Pessoas
> {
  constructor(private readonly pessoasService: PessoasService) {
    super(pessoasService);
  }
}
