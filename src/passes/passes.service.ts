import { Model } from 'mongoose';
import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CacheService } from '../services/cache.service';

import { PassesDocument } from './schemas/passes.schema';
import { CreatePassesDto } from './dto/create-passes.dto';

import { MongoGenericService } from '../base/model.generic.service';
import { UpdatePassesDto } from './dto/update-pass.dto';

@Injectable()
export class PassesService extends MongoGenericService<
  PassesDocument,
  CreatePassesDto,
  UpdatePassesDto
> {
  constructor(
    @InjectModel('Passes')
    protected readonly PassesModel: Model<PassesDocument>,
    @Inject(CacheService) cacheService: CacheService,
  ) {
    super(PassesModel, cacheService);
  }
}
