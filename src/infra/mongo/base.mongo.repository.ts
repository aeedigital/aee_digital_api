import { MongoGenericService } from '../../base/model.generic.service';
import { CacheService } from '../../services/cache.service';
import { Model } from 'mongoose';
import { NotFoundException } from '@nestjs/common';

/**
 * Generic Mongo repository that reuses the legacy MongoGenericService for
 * caching and filter handling, but maps the persistence model to domain
 * entities via `toDomain`/`toPersistence`.
 */
export abstract class BaseMongoRepository<
  TDomain,
  TCreate,
  TUpdate = TCreate,
  TFilter = any,
> extends MongoGenericService<any, TCreate, TUpdate> {
  constructor(
    protected readonly modelRef: Model<any>,
    protected readonly cache: CacheService,
  ) {
    super(modelRef, cache);
  }

  protected abstract toDomain(doc: any): TDomain;

  protected buildFilter(filter?: Partial<TFilter>): Record<string, any> {
    return (filter as any) || {};
  }

  protected toPersistence(data: TCreate | TUpdate): any {
    return data as any;
  }

  async create(data: TCreate): Promise<TDomain> {
    const saved = await super.create(this.toPersistence(data));
    return this.toDomain(saved);
  }

  async findAll(filter?: TFilter): Promise<TDomain[]> {
    const docs = await super.findAll(this.buildFilter(filter) as any);
    return docs.map((doc) => this.toDomain(doc));
  }

  async findById(id: string): Promise<TDomain | null> {
    const doc = await this.modelRef.findById(id).lean();
    return doc ? this.toDomain(doc) : null;
  }

  async update(id: string, data: TUpdate): Promise<TDomain> {
    const updated = await super.update(id, this.toPersistence(data));
    if (!updated) {
      throw new NotFoundException('Resource not found');
    }
    return this.toDomain(updated);
  }

  async updateOrCreate(
    filter: Partial<TFilter> & { id?: string },
    data: TCreate,
  ): Promise<TDomain> {
    const query: Record<string, any> = { ...this.buildFilter(filter) };
    if (filter?.id) query['_id'] = filter.id;
    const saved = await super.updateOrCreate(query, this.toPersistence(data));
    return this.toDomain(saved);
  }

  async delete(id: string): Promise<void> {
    await super.delete(id);
  }
}
