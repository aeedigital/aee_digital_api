import { ParameterStoreProvisioner } from './parameter-store.provisioner';

describe('ParameterStoreProvisioner', () => {
  const createClient = () => ({
    send: jest.fn().mockResolvedValue({}),
  });

  it('writes SecureString parameters under the explicit environment prefix', async () => {
    const client = createClient();
    const provisioner = new ParameterStoreProvisioner(client);

    await provisioner.putSecureStrings('test', {
      MONGODB_URI: 'mongodb://test.invalid',
      LOCATION_UPDATE_TOKEN: 'test-location-token',
    });

    expect(client.send).toHaveBeenCalledTimes(2);
    expect(
      client.send.mock.calls.map(([command]) => command.input),
    ).toEqual([
      {
        Name: '/aee/test/MONGODB_URI',
        Value: 'mongodb://test.invalid',
        Type: 'SecureString',
        Overwrite: true,
      },
      {
        Name: '/aee/test/LOCATION_UPDATE_TOKEN',
        Value: 'test-location-token',
        Type: 'SecureString',
        Overwrite: true,
      },
    ]);
  });

  it('rejects an empty environment before writing any parameter', async () => {
    const client = createClient();
    const provisioner = new ParameterStoreProvisioner(client);

    await expect(
      provisioner.putSecureStrings('', {
        MONGODB_URI: 'mongodb://test.invalid',
      }),
    ).rejects.toThrow('Parameter environment is required');
    expect(client.send).not.toHaveBeenCalled();
  });

  it('rejects empty secret values without logging them or calling SSM', async () => {
    const client = createClient();
    const provisioner = new ParameterStoreProvisioner(client);
    const log = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    const secret = 'test-secret-value';

    try {
      await expect(
        provisioner.putSecureStrings('test', {
          MONGODB_URI: secret,
          LOCATION_UPDATE_TOKEN: '   ',
        }),
      ).rejects.toThrow('Runtime parameter value is required: LOCATION_UPDATE_TOKEN');
      expect(client.send).not.toHaveBeenCalled();
      expect(log).not.toHaveBeenCalled();
    } finally {
      log.mockRestore();
    }
  });
});
