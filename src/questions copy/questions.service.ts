import { Model } from 'mongoose';
import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CacheService } from '../services/cache.service';

import { QuestionsDocument } from './schemas/questions.schema';

import { MongoGenericService } from '../base/model.generic.service';

@Injectable()
export class QuestionsService extends MongoGenericService<QuestionsDocument> {
  constructor(
    @InjectModel('Questions')
    protected readonly QuestionsModel: Model<QuestionsDocument>,
    @Inject(CacheService) cacheService: CacheService,
  ) {
    super(QuestionsModel, cacheService);
  }
}
