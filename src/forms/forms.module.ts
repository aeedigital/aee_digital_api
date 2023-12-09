import { CacheModule, Module } from '@nestjs/common';

import { MongooseModule } from '@nestjs/mongoose';
import { FormService } from './forms.service';
import { CacheService } from '../services/cache.service';

import { FormsController } from './forms.controller';

import { Forms, FormSchema } from './schemas/forms.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Forms.name, schema: FormSchema }]),
    CacheModule.register(), // Importe o CacheModule e registre-o aqui
  ],

  controllers: [FormsController],
  providers: [FormService, CacheService],
})
export class FormsModule {}
