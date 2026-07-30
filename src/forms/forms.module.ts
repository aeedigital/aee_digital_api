import { Module } from '@nestjs/common';

import { CacheService } from '../services/cache.service';

import { FormsController } from './forms.controller';

import { Forms, FormSchema } from './schemas/forms.schema';
import { CacheModule } from '@nestjs/cache-manager';
import { FORM_REPOSITORY } from '../domain/repositories/repository.tokens';
import { FormsAppService } from '../application/forms/forms.service';
import { PersistenceModule } from '../infra/persistence/persistence.module';

@Module({
  imports: [
    CacheModule.register(), // Importe o CacheModule e registre-o aqui
    PersistenceModule.forRoot(),
  ],

  controllers: [FormsController],
  providers: [
    FormsAppService,
    CacheService,
    // repository provided by PersistenceModule
  ],
  exports: [FormsAppService],
})
export class FormsModule {}
