import { Model } from 'mongoose';
import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CacheService } from '../services/cache.service';

import { AnswersDocument } from './schemas/answers.schema';
import { CreateAnswersDto } from './dto/create-answers.dto';

import { MongoGenericService } from '../base/model.generic.service';

@Injectable()
export class AnswersService extends MongoGenericService<
  AnswersDocument,
  CreateAnswersDto
> {
  constructor(
    @InjectModel('Answers')
    protected readonly AnswersModel: Model<AnswersDocument>,
    @Inject(CacheService) cacheService: CacheService,
  ) {
    super(AnswersModel, cacheService);
  }
}
