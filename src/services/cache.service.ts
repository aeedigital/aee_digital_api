import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Injectable, Inject } from '@nestjs/common';

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async get(key: string): Promise<any> {
    return this.cacheManager.get(key);
  }

  async set(key: string, value: any, options?: { ttl: number }): Promise<void> {
    const ttl = options?.ttl || 0;
    await this.cacheManager.set(key, value, ttl);
  }

  async delete(key: string): Promise<void> {
    await this.clearCache(key);
    // await this.cacheManager.del(key);
  }

  async clearCache(startsWithWord) {
    const keys = await this.cacheManager.store.keys();
    for (const key of keys) {
      if (key.startsWith(startsWithWord)) {
        await this.cacheManager.del(key);
      }
    }
  }

  async reset(): Promise<void> {
    await this.cacheManager.reset();
  }
}
