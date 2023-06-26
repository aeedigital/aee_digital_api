import { CacheModule, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CentrosService } from './centros.service';
import { CacheService } from '../services/cache.service'

import { CentrosController } from './centros.controller';

import { CentroSchema } from './schemas/centro.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Centro', schema: CentroSchema }]),
    CacheModule.register(), // Importe o CacheModule e registre-o aqui
  ],

  controllers: [CentrosController],
  providers: [CentrosService, CacheService],
})
export class CentrosModule {}
