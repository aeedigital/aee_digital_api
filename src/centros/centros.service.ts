import { Model } from 'mongoose';
import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CacheService } from '../services/cache.service';

import { CentroDocument } from './schemas/centro.schema';
import { CreateCentroDto } from './dto/create-centro.dto';

import { MongoGenericService } from '../base/model.generic.service';

@Injectable()
export class CentrosService extends MongoGenericService<
  CentroDocument,
  CreateCentroDto
> {
  constructor(
    @InjectModel('Centro')
    protected readonly centroModel: Model<CentroDocument>,
    @Inject(CacheService) cacheService: CacheService,
  ) {
    super(centroModel, cacheService);
  }
}
