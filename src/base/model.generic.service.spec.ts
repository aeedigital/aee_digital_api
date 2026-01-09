import { MongoGenericService } from './model.generic.service';
import { CacheService } from '../services/cache.service';

describe('MongoGenericService', () => {
  let service: MongoGenericService<any, any, any>;
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

    service = new MongoGenericService(model, cache);
  });

  it('formats field params', () => {
    expect(service['formatFieldParams']('a,b')).toBe('a b');
  });

  it('patches params into $and', () => {
    const result = service.patchParams({ a: '1', b: '2' });
    expect(result).toEqual({ $and: [{ a: '1' }, { b: '2' }] });
  });

  it('finds all with cache', async () => {
    cache.get.mockResolvedValueOnce(null);
    cache.set.mockResolvedValueOnce(undefined);
    const result = await service.findAll({ fields: 'a,b' });
    expect(result).toEqual([{ _id: '1' }]);
    expect(cache.set).toHaveBeenCalled();
  });

  it('finds one by id', async () => {
    cache.get.mockResolvedValueOnce(null);
    cache.set.mockResolvedValueOnce(undefined);
    const result = await service.findOne('1');
    expect(result).toEqual({ _id: '1' });
  });

  it('creates a document', async () => {
    cache.set.mockResolvedValueOnce(undefined);
    const result = await service.create({ name: 'test' });
    expect(result).toEqual({ name: 'test', _id: '1' });
  });

  it('updates a document', async () => {
    cache.set.mockResolvedValueOnce(undefined);
    const result = await service.update('1', { name: 'updated' });
    expect(result).toEqual({ _id: '1' });
  });

  it('updateOrCreate a document', async () => {
    cache.set.mockResolvedValueOnce(undefined);
    const result = await service.updateOrCreate({ id: '1' }, { name: 'upsert' });
    expect(result).toEqual({ _id: '1' });
  });

  it('deletes a document', async () => {
    cache.delete.mockResolvedValueOnce(undefined);
    await service.delete('1');
    expect(cache.delete).toHaveBeenCalledWith('test:1');
  });
});
