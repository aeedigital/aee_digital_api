import { CacheService } from './cache.service';

describe('CacheService', () => {
  let cacheService: CacheService;
  let cacheManagerMock: any;

  beforeEach(() => {
    cacheManagerMock = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      reset: jest.fn(),
    };
    cacheService = new CacheService(cacheManagerMock);
  });

  describe('get', () => {
    it('should call cacheManager.get with the provided key', async () => {
      const key = 'test-key';

      await cacheService.get(key);

      expect(cacheManagerMock.get).toHaveBeenCalledWith(key);
    });
  });

  describe('set', () => {
    it('should call cacheManager.set with the provided key, value, and options', async () => {
      const key = 'test-key';
      const value = 'test-value';
      const options = { ttl: 60 };

      await cacheService.set(key, value, options);

      expect(cacheManagerMock.set).toHaveBeenCalledWith(
        key,
        value,
        options.ttl,
      );
    });

    it('should call cacheManager.set with the provided key and value without options', async () => {
      const key = 'test-key';
      const value = 'test-value';

      await cacheService.set(key, value);

      expect(cacheManagerMock.set).toHaveBeenCalledWith(key, value, 0);
    });
  });

  describe('delete', () => {
    it('should call cacheManager.del with the provided key', async () => {
      const key = 'test-key';

      await cacheService.delete(key);

      expect(cacheManagerMock.del).toHaveBeenCalledWith(key);
    });
  });

  describe('reset', () => {
    it('should call cacheManager.reset', async () => {
      await cacheService.reset();

      expect(cacheManagerMock.reset).toHaveBeenCalled();
    });
  });
});
