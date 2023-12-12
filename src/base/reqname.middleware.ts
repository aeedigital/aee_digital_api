/*
https://docs.nestjs.com/middleware#middleware
*/

import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Injectable()
export class ReqnameMiddleware implements NestMiddleware {
  private readonly logger = new Logger();

  use(req: Request, res: Response, next) {
    const toLog = {
      req: req.baseUrl,
      body: req.body,
    };
    this.logger.log(`Request...`, JSON.stringify(toLog));
    next();
  }
}
