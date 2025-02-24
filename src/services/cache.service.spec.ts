import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { CacheService } from './cache.service';
import { Cache } from 'cache-manager';

describe('CacheService', () => {
  let cacheService: CacheService;
  let cacheManager: Cache;

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    store: {
      keys: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    cacheService = module.get<CacheService>(CacheService);
    cacheManager = module.get<Cache>(CACHE_MANAGER);

    jest.clearAllMocks();
  });

  describe('get', () => {
    it('deve retornar valor do cache se existir', async () => {
      mockCacheManager.get.mockResolvedValue('valor_cacheado');
      const result = await cacheService.get('test:key');
      expect(result).toBe('valor_cacheado');
    });

    it('deve retornar null se não encontrar valor no cache', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      const result = await cacheService.get('test:key');
      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('deve armazenar um valor no cache e rastrear a chave', async () => {
      mockCacheManager.set.mockResolvedValue(undefined);
      mockCacheManager.get.mockResolvedValue([]);

      await cacheService.set('test:key', 'new_value', { ttl: 100 });

      expect(mockCacheManager.set).toHaveBeenCalledWith('test:key', 'new_value', 100);
      expect(mockCacheManager.get).toHaveBeenCalledWith('test:cachekeys');
    });
  });

  describe('delete', () => {
    it('deve deletar uma chave específica do cache', async () => {
      mockCacheManager.del.mockResolvedValue(undefined);

      await cacheService.delete('test:key');

      expect(mockCacheManager.del).toHaveBeenCalledWith('test:key');
    });
  });

  describe('invalidateModelCache', () => {
    it('deve invalidar todas as chaves relacionadas a um modelo', async () => {
      mockCacheManager.get.mockResolvedValue(['test:key1', 'test:key2']);
      mockCacheManager.del.mockResolvedValue(undefined);

      await cacheService.invalidateModelCache('test');

      expect(mockCacheManager.get).toHaveBeenCalledWith('test:cachekeys');
      expect(mockCacheManager.del).toHaveBeenCalledWith('test:key1');
      expect(mockCacheManager.del).toHaveBeenCalledWith('test:key2');
      expect(mockCacheManager.del).toHaveBeenCalledWith('test:cachekeys');
    });
  });

  describe('trackCacheKey', () => {
    it('deve adicionar uma nova chave ao rastreador de cache', async () => {
      mockCacheManager.get.mockResolvedValue([]);
      mockCacheManager.set.mockResolvedValue(undefined);

      // Chamando o método privado indiretamente pelo set()
      await cacheService.set('test:key', 'value');

      expect(mockCacheManager.get).toHaveBeenCalledWith('test:cachekeys');
      expect(mockCacheManager.set).toHaveBeenCalledWith('test:cachekeys', ['test:key']);
    });

    it('não deve adicionar chaves duplicadas', async () => {
      mockCacheManager.get.mockResolvedValue(['test:key']);
      mockCacheManager.set.mockResolvedValue(undefined);

      await cacheService.set('test:key', 'value');

      expect(mockCacheManager.get).toHaveBeenCalledWith('test:cachekeys');
      expect(mockCacheManager.set).not.toHaveBeenCalledWith('test:cachekeys', ['test:key', 'test:key']);
    });
  });
});