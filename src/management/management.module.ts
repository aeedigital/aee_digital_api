import { CacheService } from '../services/cache.service';
import { ManagementController } from './management.controller';
import { ManagementService } from './management.service';
/*
https://docs.nestjs.com/modules
*/

import { Module } from '@nestjs/common';

@Module({
  imports: [
  ],
  controllers: [ManagementController],
  providers: [ManagementService, CacheService],
})
export class ManagementModule {
 
}
