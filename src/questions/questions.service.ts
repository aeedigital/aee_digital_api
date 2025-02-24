import { Model } from 'mongoose';
import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CacheService } from '../services/cache.service';

import { QuestionsDocument } from './schemas/questions.schema';
import { CreateQuestionsDto } from './dto/create-questions.dto';

import { MongoGenericService } from '../base/model.generic.service';

@Injectable()
export class QuestionsService extends MongoGenericService<
  QuestionsDocument,
  CreateQuestionsDto
> {
  constructor(
    @InjectModel('Questions')
    protected readonly QuestionsModel: Model<QuestionsDocument>,
    protected readonly cacheService: CacheService,
  ) {
    super(QuestionsModel, cacheService);
  }
}
