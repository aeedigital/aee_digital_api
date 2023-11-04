import { CacheModule, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PessoasService } from './pessoas.service';
import { CacheService } from '../services/cache.service';

import { PessoasController } from './pessoas.controller';

import { PessoasSchema } from './schemas/pessoas.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Pessoas', schema: PessoasSchema }]),
    CacheModule.register(), // Importe o CacheModule e registre-o aqui
  ],

  controllers: [PessoasController],
  providers: [PessoasService, CacheService],
})
export class PessoasModule {}
