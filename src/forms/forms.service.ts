import { Model } from 'mongoose';
import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CacheService } from '../services/cache.service';

import { FormDocument } from './schemas/forms.schema';

import { MongoGenericService } from '../base/model.generic.service';

@Injectable()
export class FormService extends MongoGenericService<FormDocument> {
  constructor(
    @InjectModel('Form')
    protected readonly FormModel: Model<FormDocument>,
    @Inject(CacheService) cacheService: CacheService,
  ) {
    super(FormModel, cacheService);
  }
}
