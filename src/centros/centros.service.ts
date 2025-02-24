import { Model } from 'mongoose';
import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CacheService } from '../services/cache.service';

import { CentroDocument } from './schemas/centro.schema';

import { SummariesDocument } from '../summary/schemas/summaries.schema';
import { FilterDto } from '../summary/dto/filter-summaries.dto';


import { CreateCentroDto } from './dto/create-centro.dto';

import { MongoGenericService } from '../base/model.generic.service';
import { SummaryService } from '../summary/summary.service';

@Injectable()
export class CentrosService extends MongoGenericService<
  CentroDocument,
  CreateCentroDto
> {
  constructor(
    @InjectModel('Centro')
    protected readonly centroModel: Model<CentroDocument>,
    protected readonly cacheService: CacheService,
    protected readonly summariesService: SummaryService,
  ) {
    super(centroModel, cacheService);
  }


  async findSummaries(id:string, filter: FilterDto): Promise<SummariesDocument[]>{
    const query: FilterDto = {
      CENTRO_ID: id,
      ...filter
    }
    let summaries: SummariesDocument[] = await this.summariesService.findAll(query)

    return summaries;
  }
}
