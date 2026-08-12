import {
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { LocationUpdateTokenGuard } from './location-update-token.guard';

describe('LocationUpdateTokenGuard', () => {
  const originalToken = process.env.LOCATION_UPDATE_TOKEN;
  const guard = new LocationUpdateTokenGuard();

  function contextWithToken(token?: string): any {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: token ? { 'x-location-update-token': token } : {},
        }),
      }),
    };
  }

  afterAll(() => {
    if (originalToken === undefined) delete process.env.LOCATION_UPDATE_TOKEN;
    else process.env.LOCATION_UPDATE_TOKEN = originalToken;
  });

  it('fails closed when token is not configured', () => {
    delete process.env.LOCATION_UPDATE_TOKEN;
    expect(() => guard.canActivate(contextWithToken())).toThrow(
      ServiceUnavailableException,
    );
  });

  it('rejects a missing or invalid token', () => {
    process.env.LOCATION_UPDATE_TOKEN = 'expected-token';
    expect(() => guard.canActivate(contextWithToken())).toThrow(
      UnauthorizedException,
    );
    expect(() => guard.canActivate(contextWithToken('invalid-token'))).toThrow(
      UnauthorizedException,
    );
  });

  it('accepts configured token', () => {
    process.env.LOCATION_UPDATE_TOKEN = 'expected-token';
    expect(guard.canActivate(contextWithToken('expected-token'))).toBe(true);
  });
});
