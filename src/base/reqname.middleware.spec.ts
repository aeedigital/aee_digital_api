import { ReqnameMiddleware } from './reqname.middleware';
import { WinstonLogger } from '../services/logger.service';

describe('ReqnameMiddleware', () => {
  it('logs request and calls next', () => {
    const logger: Pick<WinstonLogger, 'logRequest'> = {
      logRequest: jest.fn(),
    };
    const middleware = new ReqnameMiddleware(logger as WinstonLogger);
    const next = jest.fn();
    const req: any = { method: 'GET', url: '/test', body: { ok: true } };
    const res: any = {};

    middleware.use(req, res, next);

    expect(logger.logRequest).toHaveBeenCalledWith('GET', '/test', JSON.stringify({ ok: true }));
    expect(next).toHaveBeenCalled();
  });
});
