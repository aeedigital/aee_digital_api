import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { Summaries, SummariesDocument } from './schemas/summaries.schema';
import { Model } from 'mongoose';
import { CreateSummariesDto } from './dto/create-summaries.dto';
import { MongoGenericService } from '../base/model.generic.service';
import { CacheService } from '../services/cache.service';
import { UpdateSummaryDto } from './dto/update-summary.dto';

@Injectable()
export class SummaryService extends MongoGenericService<
  SummariesDocument,
  CreateSummariesDto,
  UpdateSummaryDto
> {
  constructor(
    @InjectModel(Summaries.name)
    protected readonly SummariesModel: Model<SummariesDocument>,
    protected readonly cacheService: CacheService,
  ) {
    super(SummariesModel, cacheService);
  }
}
