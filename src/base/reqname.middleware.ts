/*
https://docs.nestjs.com/middleware#middleware
*/

import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express';
import { WinstonLogger } from '../services/logger.service';

@Injectable()
export class ReqnameMiddleware implements NestMiddleware {
  constructor(private readonly logger: WinstonLogger) {}

  use(req: Request, res: Response, next) {
    const previewBody =
      req.body && typeof req.body === 'object'
        ? JSON.stringify(req.body).slice(0, 200)
        : req.body;

    this.logger.logRequest(req.method, req.originalUrl || req.baseUrl, previewBody);
    next();
  }
}
