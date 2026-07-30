jest.mock('winston', () => {
  const error = jest.fn();
  const info = jest.fn();
  return {
    createLogger: jest.fn(() => ({ error, info })),
    format: {
      combine: jest.fn(),
      timestamp: jest.fn(),
      json: jest.fn(),
    },
    transports: {
      Console: jest.fn(),
      File: jest.fn(),
    },
  };
});

import { WinstonLogger } from './logger.service';
import { createLogger } from 'winston';

describe('WinstonLogger', () => {
  it('logs request and error on dedicated logger instances', () => {
    const logger = new WinstonLogger();

    logger.log('info');
    logger.error('error');
    logger.warn('warn');
    logger.debug('debug');
    logger.verbose('verbose');
    logger.logRequest('GET', '/health', { ok: true });

    const errorInstance = (createLogger as jest.Mock).mock.results[0].value;
    const requestInstance = (createLogger as jest.Mock).mock.results[1].value;
    expect(errorInstance.error).toHaveBeenCalledWith('error', {
      trace: undefined,
      context: undefined,
    });
    expect(requestInstance.info).toHaveBeenCalledWith('request', {
      method: 'GET',
      url: '/health',
      body: { ok: true },
    });
  });
});
