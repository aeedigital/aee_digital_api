import { Model } from 'mongoose';
import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CacheService } from '../services/cache.service';

import { PassesDocument } from './schemas/passes.schema';

import { MongoGenericService } from '../base/model.generic.service';

@Injectable()
export class PassesService extends MongoGenericService<PassesDocument> {
  constructor(
    @InjectModel('Passes')
    protected readonly PassesModel: Model<PassesDocument>,
    @Inject(CacheService) cacheService: CacheService,
  ) {
    super(PassesModel, cacheService);
  }
}
