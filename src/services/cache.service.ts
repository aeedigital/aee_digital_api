import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Injectable, Inject, Logger } from '@nestjs/common';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  // Adiciona uma chave ao conjunto de chaves rastreadas
  private async trackCacheKey(key: string): Promise<void> {
    const modelName = key.split(':')[0].toLowerCase();
    const trackedKey = `${modelName}:cachekeys`;

    const existingKeys = (await this.get(trackedKey)) || [];
    const lowerKey = key.toLowerCase();
    if (!existingKeys.includes(lowerKey)) {
      existingKeys.push(lowerKey);
      await this.cacheManager.set(trackedKey, existingKeys);
    }
  }

  // Invalida todas as chaves associadas ao modelo
  async invalidateModelCache(modelName: string): Promise<void> {
    const trackedKey = `${modelName.toLowerCase()}:cachekeys`;
    const cacheKeys: string[] = (await this.get(trackedKey)) || [];

    for (const key of cacheKeys) {
      await this.deleteWithoutInvalidation(key); // Evita a recursão
    }

    await this.deleteWithoutInvalidation(trackedKey); // Limpa o rastreador de chaves
  }

  async get(key: string): Promise<any | null> {
    try {
      const value = await this.cacheManager.get(key.toLowerCase());
      return value || null;
    } catch (error) {
      this.logger.error(`Erro ao buscar cache para a chave: ${key}`, error);
      return null;
    }
  }

  // Set com invalidação automática do cache relacionado
  async set(key: string, value: any, options?: { ttl?: number }): Promise<void> {
    try {
      const ttl = options?.ttl || 0;
      await this.invalidateModelCache(key.split(':')[0]); // Invalida caches relacionados ao modelo
      await this.cacheManager.set(key.toLowerCase(), value, ttl);
      await this.trackCacheKey(key);
    } catch (error) {
      this.logger.error(`Erro ao definir cache para a chave: ${key}`, error);
    }
  }

  // Delete público que também invalida caches relacionados ao modelo
  async delete(key: string): Promise<void> {
    try {
      await this.invalidateModelCache(key.split(':')[0]); // Invalida caches relacionados ao modelo
      await this.deleteWithoutInvalidation(key);
    } catch (error) {
      this.logger.error(`Erro ao deletar cache para a chave: ${key}`, error);
    }
  }

  // Método privado que deleta uma chave sem acionar invalidação
  private async deleteWithoutInvalidation(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key.toLowerCase());
    } catch (error) {
      this.logger.error(`Erro ao deletar cache sem invalidar para a chave: ${key}`, error);
    }
  }

  async clearCache(prefix: string): Promise<void> {
    try {
      const lowerPrefix = prefix.toLowerCase();
      if ('store' in this.cacheManager && typeof (this.cacheManager as any).store.keys === 'function') {
        const keys = await (this.cacheManager as any).store.keys();
        for (const key of keys) {
          if (key.toLowerCase().startsWith(lowerPrefix)) {
            await this.deleteWithoutInvalidation(key);
          }
        }
      }
    } catch (error) {
      this.logger.error(`Erro ao limpar cache com prefixo: ${prefix}`, error);
    }
  }

  async reset(): Promise<void> {
    try {
      if ('reset' in this.cacheManager && typeof (this.cacheManager as any).reset === 'function') {
        await (this.cacheManager as any).reset();
      }
    } catch (error) {
      this.logger.error('Erro ao resetar o cache', error);
    }
  }
}