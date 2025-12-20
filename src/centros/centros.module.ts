import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CacheService } from '../services/cache.service';

import { CentrosController } from './centros.controller';

import { Centro, CentroSchema } from './schemas/centro.schema';
import { SummaryModule } from '../summary/summary.module';
import { CentrosMongoRepository } from '../infra/mongo/centros.mongo.repository';
import { CENTRO_REPOSITORY } from './centros.tokens';
import { CentrosAppService } from '../application/centros/centros.service';

@Module({
  imports: [
    SummaryModule,
    MongooseModule.forFeature([{ name: Centro.name, schema: CentroSchema }]),
  ],

  controllers: [CentrosController],
  providers: [
    CentrosAppService,
    CacheService,
    {
      provide: CENTRO_REPOSITORY,
      useClass: CentrosMongoRepository,
    },
  ],
  exports: [CentrosAppService],
})
export class CentrosModule {}
