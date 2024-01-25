import { CacheService } from '../services/cache.service';
import { ManagementController } from './management.controller';
import { ManagementService } from './management.service';
/*
https://docs.nestjs.com/modules
*/

import { CacheModule, Module } from '@nestjs/common';

@Module({
  imports: [
    CacheModule.register(), // Importe o CacheModule e registre-o aqui
  ],
  controllers: [ManagementController],
  providers: [ManagementService, CacheService],
})
export class ManagementModule {
 
}
