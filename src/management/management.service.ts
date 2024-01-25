/*
https://docs.nestjs.com/providers#services
*/


import { Inject, Injectable } from '@nestjs/common';
import { CacheService } from '../services/cache.service';

@Injectable()
export class ManagementService {
  constructor(@Inject(CacheService) private cacheService: CacheService) {}

  async clearCache(){
    this.cacheService.reset();
  }
}
