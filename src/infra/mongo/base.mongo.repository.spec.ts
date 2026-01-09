import { BaseMongoRepository } from './base.mongo.repository';
import { CacheService } from '../../services/cache.service';

class TestRepository extends BaseMongoRepository<any, any, any, any> {
  protected toDomain(doc: any) {
    return { id: doc._id, ...doc };
  }
}

describe('BaseMongoRepository', () => {
  let repository: TestRepository;
  let model: any;
  let cache: jest.Mocked<CacheService>;

  beforeEach(() => {
    const query = {
      select: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([{ _id: '1' }]),
    };
    model = jest.fn().mockImplementation((data) => ({
      ...data,
      save: jest.fn().mockResolvedValue({
        ...data,
        _id: '1',
        toObject: () => ({ ...data, _id: '1' }),
      }),
    }));
    model.modelName = 'Test';
    model.watch = jest.fn(() => ({ on: jest.fn() }));
    model.find = jest.fn(() => query);
    model.findById = jest.fn(() => ({
      lean: jest.fn().mockResolvedValue({ _id: '1' }),
      exec: jest.fn().mockResolvedValue({
        save: jest.fn().mockResolvedValue({
          _id: '1',
          toObject: () => ({ _id: '1' }),
        }),
      }),
    }));
    model.findOneAndUpdate = jest.fn(() => ({
      exec: jest.fn().mockResolvedValue({ _id: '1' }),
    }));
    model.deleteOne = jest.fn(() => ({ lean: jest.fn().mockResolvedValue(undefined) }));

    cache = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      invalidateModelCache: jest.fn(),
    } as any;

    repository = new TestRepository(model, cache);
  });

  it('creates and maps domain', async () => {
    cache.get.mockResolvedValueOnce(null);
    cache.set.mockResolvedValueOnce(undefined);
    const result = await repository.create({ name: 'test' });
    expect(result).toEqual({ id: '1', name: 'test', _id: '1' });
  });

  it('finds all and maps domain', async () => {
    cache.get.mockResolvedValueOnce(null);
    cache.set.mockResolvedValueOnce(undefined);
    const result = await repository.findAll({});
    expect(result).toEqual([{ id: '1', _id: '1' }]);
  });

  it('finds by id', async () => {
    const result = await repository.findById('1');
    expect(result).toEqual({ id: '1', _id: '1' });
  });

  it('updates a document', async () => {
    cache.set.mockResolvedValueOnce(undefined);
    const result = await repository.update('1', { name: 'updated' });
    expect(result).toEqual({ id: '1', _id: '1' });
  });

  it('updateOrCreate a document', async () => {
    cache.set.mockResolvedValueOnce(undefined);
    const result = await repository.updateOrCreate({ id: '1' }, { name: 'upsert' });
    expect(result).toEqual({ id: '1', _id: '1' });
  });

  it('deletes a document', async () => {
    cache.delete.mockResolvedValueOnce(undefined);
    await repository.delete('1');
    expect(cache.delete).toHaveBeenCalledWith('test:1');
  });
});
