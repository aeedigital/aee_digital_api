import { Module } from '@nestjs/common';

import { MongooseModule } from '@nestjs/mongoose';
import { CacheService } from '../services/cache.service';

import { FormsController } from './forms.controller';

import { Forms, FormSchema } from './schemas/forms.schema';
import { CacheModule } from '@nestjs/cache-manager';
import { FormsMongoRepository } from '../infra/mongo/forms.mongo.repository';
import { FORM_REPOSITORY } from '../domain/repositories/repository.tokens';
import { FormsAppService } from '../application/forms/forms.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Forms.name, schema: FormSchema }]),
    CacheModule.register(), // Importe o CacheModule e registre-o aqui
  ],

  controllers: [FormsController],
  providers: [
    FormsAppService,
    CacheService,
    {
      provide: FORM_REPOSITORY,
      useClass: FormsMongoRepository,
    },
  ],
})
export class FormsModule {}
