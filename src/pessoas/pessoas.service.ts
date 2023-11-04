import { Model } from 'mongoose';
import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CacheService } from '../services/cache.service';

import { PessoasDocument } from './schemas/pessoas.schema';

import { MongoGenericService } from '../base/model.generic.service';

@Injectable()
export class PessoasService extends MongoGenericService<PessoasDocument> {
  constructor(
    @InjectModel('Pessoas')
    protected readonly PessoasModel: Model<PessoasDocument>,
    @Inject(CacheService) cacheService: CacheService,
  ) {
    super(PessoasModel, cacheService);
  }
}
