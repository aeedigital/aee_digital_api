import { ReqnameMiddleware } from './reqname.middleware';
import { Logger } from '@nestjs/common';

describe('ReqnameMiddleware', () => {
  it('logs request and calls next', () => {
    const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    const middleware = new ReqnameMiddleware();
    const next = jest.fn();
    const req: any = { baseUrl: '/test', body: { ok: true } };
    const res: any = {};

    middleware.use(req, res, next);

    expect(logSpy).toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
    logSpy.mockRestore();
  });
});
