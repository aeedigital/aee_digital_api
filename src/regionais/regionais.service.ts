import { Model } from 'mongoose';
import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CacheService } from '../services/cache.service';

import { RegionalDocument } from './schemas/regionais.schema';
import { CreateRegionalDto } from './dto/create-regional.dto';

import { MongoGenericService } from '../base/model.generic.service';
import { CentrosService } from '../centros/centros.service';
import { SummaryService } from '../summary/summary.service';

import { SummariesDocument } from '../summary/schemas/summaries.schema';
import { FilterDto } from '../summary/dto/filter-summaries.dto';

import { FilterDto as CentroFilterDto } from '../centros/dto/filter-centro.dto';
import { CentroDocument } from '../centros/schemas/centro.schema';
import { UpdateRegionalDto } from './dto/update-regional.dto';


@Injectable()
export class RegionalService extends MongoGenericService<
  RegionalDocument,
  CreateRegionalDto,
  UpdateRegionalDto
> {
  constructor(
    @InjectModel('Regional')
    protected readonly regionalModel: Model<RegionalDocument>,
    protected readonly cacheService: CacheService,
    protected readonly centrosService: CentrosService,
    protected readonly summariesService: SummaryService
  ) {
    super(regionalModel, cacheService);
  }

  async findCentros(id: string, filter: CentroFilterDto): Promise<CentroDocument[]>{
    const centroQuery: CentroFilterDto = {
      REGIONAL: id,
      ...filter
    };
   
    const centros = await this.centrosService.findAll(centroQuery);
    return centros;
  }

  async findSummaries(id: string, filter: FilterDto): Promise<SummariesDocument[]> {
    const centroQuery: CentroFilterDto = {
      REGIONAL: id,
    };
  
    const centros = await this.centrosService.findAll(centroQuery);
  
    // Array para acumular as promessas
    const summariesPromises = centros.map((centro) => {
      const query: FilterDto = {
        CENTRO_ID: String(centro._id),
        ...filter,
      };
  
      // Retorna a promessa da chamada de `findAll` para ser usada no Promise.all
      return this.summariesService.findAll(query);
    });
  
    // Espera todas as promessas serem resolvidas e as concatena em um único array
    const summariesArray = await Promise.all(summariesPromises);
  
    // Concatena os arrays de summaries em um único array
    const summaries = summariesArray.flat();
  
    return summaries;
  }
}
