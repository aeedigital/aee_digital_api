import { Model } from 'mongoose';
import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CacheService } from '../services/cache.service';

import { PessoasDocument } from './schemas/pessoas.schema';
import { CreatePessoasDto } from './dto/create-pessoas.dto';

import { MongoGenericService } from '../base/model.generic.service';

@Injectable()
export class PessoasService extends MongoGenericService<
  PessoasDocument,
  CreatePessoasDto
> {
  constructor(
    @InjectModel('Pessoas')
    protected readonly PessoasModel: Model<PessoasDocument>,
    protected readonly cacheService: CacheService,
  ) {
    super(PessoasModel, cacheService);
  }
}
