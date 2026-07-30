import { Injectable, LoggerService, Scope } from '@nestjs/common';
import { createLogger, format, transports } from 'winston';

const jsonFmt = format.combine(format.timestamp(), format.json());

/**
 * Logger enxuto para economizar custo em CloudWatch:
 * - Só envia erros.
 * - Entrada de requisição é logada explicitamente via logRequest.
 * - Demais níveis são no-op.
 */
@Injectable({ scope: Scope.TRANSIENT })
export class WinstonLogger implements LoggerService {
  private readonly errorLogger = createLogger({
    level: 'error',
    format: jsonFmt,
    transports: [new transports.Console({ level: 'error' })],
  });

  private readonly requestLogger = createLogger({
    level: 'info',
    format: jsonFmt,
    transports: [new transports.Console({ level: 'info' })],
  });

  // No-op para níveis não desejados
  log(_message: string, _context?: string) {}
  warn(_message: string, _context?: string) {}
  debug(_message: string, _context?: string) {}
  verbose(_message: string, _context?: string) {}

  error(message: string, trace?: string, context?: string) {
    this.errorLogger.error(message, { trace, context });
  }

  logRequest(method: string, url: string, bodyPreview?: unknown) {
    this.requestLogger.info('request', { method, url, body: bodyPreview });
  }
}
