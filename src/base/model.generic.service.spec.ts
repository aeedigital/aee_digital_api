import { Model, Document } from 'mongoose';
import { MongoGenericService } from './model.generic.service';
import { CacheService } from '../services/cache.service';

describe('MongoGenericService', () => {
  const modelMock = {
    find: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue([]),
    // Outros métodos que você precisa mockar
  } as unknown as Model<Document>;

  const cacheServiceMock = {
    get: jest.fn(function () {
      return { id: 1, name: 'Test Item' };
    }),
    set: jest.fn(),
    delete: jest.fn(),
    reset: jest.fn(),
  } as unknown as CacheService;

  let mongoGenericService: MongoGenericService<any>;

  beforeEach(() => {
    mongoGenericService = new MongoGenericService(modelMock, cacheServiceMock);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getCached', () => {
    it('should return cached item if it exists', async () => {
      const key = 'test-key';

      const cachedItem = { id: 1, name: 'Test Item' };
      const result = await mongoGenericService.getCached(key, jest.fn());

      expect(result).toEqual(cachedItem);
    });

    it('should save item to cache and return it if it does not exist', async () => {
      const key = 'test-key';
      const itemToSave = { id: 1, name: 'Test Item' };
      const saveMethod = jest.fn().mockResolvedValue(itemToSave);
      cacheServiceMock.get = function(){
        return null
      }

      const result = await mongoGenericService.getCached(key, saveMethod);

      expect(result).toEqual(itemToSave);
    });
  });

  // Testes para os outros métodos da classe MongoGenericService
  // findAll, findOne, create, update, delete
});
