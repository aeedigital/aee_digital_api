import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PessoasService } from './pessoas.service';
import { CacheService } from '../services/cache.service';

import { PessoasController } from './pessoas.controller';

import { Pessoas, PessoasSchema } from './schemas/pessoas.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Pessoas.name, schema: PessoasSchema }]),
  ],

  controllers: [PessoasController],
  providers: [PessoasService, CacheService],
})
export class PessoasModule {}
