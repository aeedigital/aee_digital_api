import { PartialType } from '@nestjs/mapped-types';
import { CreatePessoasDto } from './create-pessoas.dto';

export class UpdatePessoasDto extends PartialType(CreatePessoasDto) {}
