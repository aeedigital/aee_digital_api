import { CacheModule, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FormService } from './forms.service';
import { CacheService } from '../services/cache.service';

import { FormController } from './forms.controller';

import { FormSchema } from './schemas/forms.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Form', schema: FormSchema }]),
    CacheModule.register(), // Importe o CacheModule e registre-o aqui
  ],

  controllers: [FormController],
  providers: [FormService, CacheService],
})
export class FormsModule {}
