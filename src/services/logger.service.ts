// Importar os módulos necessários
import { Injectable, LoggerService, Scope } from '@nestjs/common';
import { createLogger, format, transports } from 'winston';

// Criar o serviço de logger que estende a classe Logger do nestjs
@Injectable({ scope: Scope.TRANSIENT })
export class WinstonLogger implements LoggerService {
  // Criar uma instância do logger do winston
  private logger = createLogger({
    // Configurar as opções de logging
    level: 'info', // Nível de logging
    format: format.combine(
      // Formato dos logs
      format.timestamp(), // Adicionar um timestamp
      format.json(), // Usar o formato JSON
    ),
    transports: [
      // Transportes dos logs
      new transports.Console(), // Console
      new transports.File({ filename: 'logs/error.log', level: 'error' }), // Arquivo de erros
      new transports.File({ filename: 'logs/combined.log' }), // Arquivo combinado
    ],
  });

  // Sobrescrever o método log do nestjs
  log(message: string, context?: string) {
    this.logger.log('info', message, { context });
  }

  // Sobrescrever o método error do nestjs
  error(message: string, trace?: string, context?: string) {
    this.logger.log('error', message, { trace, context });
  }

  // Sobrescrever o método warn do nestjs
  warn(message: string, context?: string) {
    this.logger.log('warn', message, { context });
  }

  // Sobrescrever o método debug do nestjs
  debug(message: string, context?: string) {
    this.logger.log('debug', message, { context });
  }

  // Sobrescrever o método verbose do nestjs
  verbose(message: string, context?: string) {
    this.logger.log('verbose', message, { context });
  }
}
