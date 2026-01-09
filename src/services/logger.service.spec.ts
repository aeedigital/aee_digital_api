jest.mock('winston', () => {
  const log = jest.fn();
  return {
    createLogger: jest.fn(() => ({ log })),
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
  it('logs at different levels', () => {
    const logger = new WinstonLogger();
    logger.log('info');
    logger.error('error');
    logger.warn('warn');
    logger.debug('debug');
    logger.verbose('verbose');

    const instance = (createLogger as jest.Mock).mock.results[0].value;
    expect(instance.log).toHaveBeenCalled();
  });
});
