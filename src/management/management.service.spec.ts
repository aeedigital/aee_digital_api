import { ManagementService } from './management.service';
import { CacheService } from '../services/cache.service';

describe('ManagementService', () => {
  it('clears cache', async () => {
    const cache = { reset: jest.fn() } as unknown as CacheService;
    const service = new ManagementService(cache);
    await service.clearCache();
    expect(cache.reset).toHaveBeenCalled();
  });
});
