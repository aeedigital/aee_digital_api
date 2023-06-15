import { CacheModule, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RegionalService } from './regionais.service';
import { CacheService } from '../services/cache.service'

import { RegionalController } from './regionais.controller';

import { RegionalSchema } from './schemas/regionais.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Regional', schema: RegionalSchema }]),
    CacheModule.register(), // Importe o CacheModule e registre-o aqui
  ],

  controllers: [RegionalController],
  providers: [RegionalService, CacheService],
})
export class RegionaisModule {}
