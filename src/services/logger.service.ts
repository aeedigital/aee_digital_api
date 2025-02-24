import { Injectable, LoggerService, Scope } from '@nestjs/common';
import { createLogger, format, transports } from 'winston';
import { LogstashTransport } from 'winston-logstash-transport';

@Injectable({ scope: Scope.TRANSIENT })
export class WinstonLogger implements LoggerService {
  private logger = createLogger({
    level: 'info',
    format: format.combine(format.timestamp(), format.json()),
    transports: [
      new transports.Console(),
      new transports.File({ filename: 'logs/error.log', level: 'error' }),
      new transports.File({ filename: 'logs/combined.log' }),
    ],
  });

  // constructor() {
  //   this.logger.add(
  //     new LogstashTransport({
  //       port: 5044,
  //       host: process.env.LOGSTASH_HOST || 'logstash',
  //     })
  //   );
  // }

  log(message: string, context?: string) {
    this.logger.log('info', message, { context });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.log('error', message, { trace, context });
  }

  warn(message: string, context?: string) {
    this.logger.log('warn', message, { context });
  }

  debug(message: string, context?: string) {
    this.logger.log('debug', message, { context });
  }

  verbose(message: string, context?: string) {
    this.logger.log('verbose', message, { context });
  }
}