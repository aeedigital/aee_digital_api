/*
https://docs.nestjs.com/controllers#controllers
*/

import { Controller, Get } from '@nestjs/common';
import { ManagementService } from './management.service';

@Controller()
export class ManagementController {
  constructor(private readonly service: ManagementService) {}

  @Get('/clearcache')
  async clearCache() {
    await this.service.clearCache();
  }
}
