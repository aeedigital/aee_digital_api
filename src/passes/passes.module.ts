import { Module } from '@nestjs/common';
import { CacheService } from '../services/cache.service';
import { PassesController } from './passes.controller';
import { PassesSchema } from './schemas/passes.schema';
import { PASS_REPOSITORY } from '../domain/repositories/repository.tokens';
import { PassesAppService } from '../application/passes/passes.service';
import { PersistenceModule } from '../infra/persistence/persistence.module';

@Module({
  imports: [PersistenceModule.forRoot()],

  controllers: [PassesController],
  providers: [
    PassesAppService,
    CacheService,
    // repository provided by PersistenceModule
  ],
})
export class PassesModule {}
