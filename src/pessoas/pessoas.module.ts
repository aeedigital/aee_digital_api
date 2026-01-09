import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CacheService } from '../services/cache.service';

import { PessoasController } from './pessoas.controller';

import { Pessoas, PessoasSchema } from './schemas/pessoas.schema';
import { PessoasMongoRepository } from '../infra/mongo/pessoas.mongo.repository';
import { PERSON_REPOSITORY } from '../domain/repositories/repository.tokens';
import { PessoasAppService } from '../application/pessoas/pessoas.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Pessoas.name, schema: PessoasSchema }]),
  ],

  controllers: [PessoasController],
  providers: [
    PessoasAppService,
    CacheService,
    {
      provide: PERSON_REPOSITORY,
      useClass: PessoasMongoRepository,
    },
  ],
})
export class PessoasModule {}
