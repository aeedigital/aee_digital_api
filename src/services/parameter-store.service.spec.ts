import { ParameterStoreService } from './parameter-store.service';

describe('ParameterStoreService', () => {
  const createClient = () => ({
    send: jest.fn(),
  });

  it('loads required SecureString values from SSM once per execution environment', async () => {
    const client = createClient();
    const env = { PARAMETER_ENVIRONMENT: 'test' };
    client.send.mockResolvedValue({
      Parameters: [
        { Name: '/aee/test/MONGODB_URI', Value: 'mongodb://test.invalid' },
        { Name: '/aee/test/LOCATION_UPDATE_TOKEN', Value: 'test-location-token' },
      ],
    });
    const service = new ParameterStoreService(client, env);

    await expect(
      service.load(['MONGODB_URI', 'LOCATION_UPDATE_TOKEN']),
    ).resolves.toEqual({
      MONGODB_URI: 'mongodb://test.invalid',
      LOCATION_UPDATE_TOKEN: 'test-location-token',
    });
    await service.load(['MONGODB_URI']);

    expect(client.send).toHaveBeenCalledTimes(1);
    expect(client.send.mock.calls[0][0].input).toEqual({
      Names: [
        '/aee/test/MONGODB_URI',
        '/aee/test/LOCATION_UPDATE_TOKEN',
      ],
      WithDecryption: true,
    });
  });

  it('fails explicitly when SSM omits a required parameter instead of using local values', async () => {
    const client = createClient();
    const env = {
      PARAMETER_ENVIRONMENT: 'test',
      MONGODB_URI: 'mongodb://local.invalid',
    };
    client.send.mockResolvedValue({
      Parameters: [],
      InvalidParameters: ['/aee/test/MONGODB_URI'],
    });
    const service = new ParameterStoreService(client, env);

    await expect(service.load(['MONGODB_URI'])).rejects.toThrow(
      'Required runtime parameter is missing: MONGODB_URI',
    );
    expect(client.send).toHaveBeenCalledTimes(1);
  });

  it('propagates SSM access failures without logging or exposing values', async () => {
    const client = createClient();
    const secret = 'test-secret-value';
    const log = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    const error = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    client.send.mockRejectedValue(new Error('AccessDeniedException'));
    const service = new ParameterStoreService(client, {
      PARAMETER_ENVIRONMENT: 'test',
      MONGODB_URI: secret,
    });

    try {
      await expect(service.load(['MONGODB_URI'])).rejects.toThrow(
        'AccessDeniedException',
      );
      expect(log).not.toHaveBeenCalled();
      expect(error).not.toHaveBeenCalled();
    } finally {
      log.mockRestore();
      error.mockRestore();
    }
  });

  it('uses local environment values without contacting SSM when no parameter environment is set', async () => {
    const client = createClient();
    const service = new ParameterStoreService(client, {
      MONGODB_URI: 'mongodb://local.invalid',
      LOCATION_UPDATE_TOKEN: 'local-token',
    });

    await expect(
      service.load(['MONGODB_URI', 'LOCATION_UPDATE_TOKEN']),
    ).resolves.toEqual({
      MONGODB_URI: 'mongodb://local.invalid',
      LOCATION_UPDATE_TOKEN: 'local-token',
    });
    expect(client.send).not.toHaveBeenCalled();
  });
});
