import {  Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassesService } from './passes.service';
import { CacheService } from '../services/cache.service';

import { PassesController } from './passes.controller';

import { PassesSchema } from './schemas/passes.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Passes', schema: PassesSchema }]),
  ],

  controllers: [PassesController],
  providers: [PassesService, CacheService],
})
export class PassesModule {}
