import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CacheService } from '../services/cache.service';

import { RegionaisController } from './regionais.controller';

import { RegionalSchema } from './schemas/regionais.schema';
import { CentrosModule } from '../centros/centros.module';
import { SummaryModule } from '../summary/summary.module';
import { RegionaisMongoRepository } from '../infra/mongo/regionais.mongo.repository';
import { REGIONAL_REPOSITORY } from './regionais.tokens';
import { RegionaisAppService } from '../application/regionais/regionais.service';

@Module({
  imports: [
    CentrosModule,
    SummaryModule,
    MongooseModule.forFeature([{ name: 'Regional', schema: RegionalSchema }]),
  ],

  controllers: [RegionaisController],
  providers: [
    RegionaisAppService,
    CacheService,
    {
      provide: REGIONAL_REPOSITORY,
      useClass: RegionaisMongoRepository,
    },
  ],
})
export class RegionaisModule {}
