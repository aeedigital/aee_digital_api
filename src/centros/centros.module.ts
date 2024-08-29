import { CacheModule, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CentrosService } from './centros.service';
import { CacheService } from '../services/cache.service';

import { CentrosController } from './centros.controller';

import { Centro, CentroSchema } from './schemas/centro.schema';
import { SummaryService } from '../summary/summary.service';
import { SummaryModule } from '../summary/summary.module';

@Module({
  imports: [
    SummaryModule,
    MongooseModule.forFeature([{ name: Centro.name, schema: CentroSchema }]),
    CacheModule.register(), // Importe o CacheModule e registre-o aqui
  ],

  controllers: [CentrosController],
  providers: [
    CentrosService, 
    CacheService
  ],
  exports:[CentrosService]
})
export class CentrosModule {}
