import { Model } from 'mongoose';
import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CacheService } from '../services/cache.service';

import { RegionalDocument } from './schemas/regionais.schema';

import { MongoGenericService } from '../base/model.generic.service';

@Injectable()
export class RegionalService extends MongoGenericService<RegionalDocument> {
  constructor(
    @InjectModel('Regional')
    protected readonly regionalModel: Model<RegionalDocument>,
    @Inject(CacheService) cacheService: CacheService,
  ) {
    super(regionalModel, cacheService);
  }
}
