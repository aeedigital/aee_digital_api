import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RegionalService } from './regionais.service';
import { CacheService } from '../services/cache.service';

import { RegionaisController } from './regionais.controller';

import { RegionalSchema } from './schemas/regionais.schema';
import { CentrosModule } from '../centros/centros.module';
import { SummaryModule } from '../summary/summary.module';

@Module({
  imports: [
    CentrosModule,
    SummaryModule,
    MongooseModule.forFeature([{ name: 'Regional', schema: RegionalSchema }]),
  ],

  controllers: [RegionaisController],
  providers: [RegionalService, CacheService],
})
export class RegionaisModule {}
