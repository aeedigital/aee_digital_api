import { Module } from '@nestjs/common';
import { CacheService } from '../services/cache.service';

import { PessoasController } from './pessoas.controller';

import { PERSON_REPOSITORY } from '../domain/repositories/repository.tokens';
import { PessoasAppService } from '../application/pessoas/pessoas.service';
import { PersistenceModule } from '../infra/persistence/persistence.module';

@Module({
  imports: [PersistenceModule.forRoot()],

  controllers: [PessoasController],
  providers: [
    PessoasAppService,
    CacheService,
    // repository provided by PersistenceModule
  ],
  exports: [PessoasAppService],
})
export class PessoasModule {}
