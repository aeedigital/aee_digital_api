/*
https://docs.nestjs.com/modules
*/

import { CacheModule } from '@nestjs/cache-manager';
import { CacheService } from '../services/cache.service';


import { Module } from '@nestjs/common';

@Module({
  imports: [
    CacheModule.register(), // Importe o CacheModule e registre-o aqui
  ],
  controllers: [],
  providers: [CacheService],
})
export class CacheableModule {}
