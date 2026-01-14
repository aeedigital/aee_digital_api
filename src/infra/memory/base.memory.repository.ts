import { CrudRepository } from '../../domain/repositories/crud.repository';

const genId = (() => {
  let counter = 0;
  return () => `${Date.now()}-${++counter}`;
})();

export abstract class BaseMemoryRepository<
  TDomain extends { id?: string },
  TCreate,
  TUpdate = TCreate,
  TFilter = Record<string, any>,
> implements CrudRepository<TDomain, TCreate, TUpdate, TFilter>
{
  protected store = new Map<string, TDomain>();

  protected matchesFilter(item: TDomain, filter?: Partial<TFilter>): boolean {
    if (!filter) return true;
    const entries = Object.entries(filter as Record<string, any>).filter(
      ([key, value]) => key !== 'fields' && value !== undefined,
    );
    return entries.every(([key, value]) => (item as any)[key] === value);
  }

  async create(data: TCreate): Promise<TDomain> {
    const id = genId();
    const item = { ...(data as any), id } as TDomain;
    this.store.set(id, item);
    return item;
  }

  async findAll(filter?: TFilter): Promise<TDomain[]> {
    return Array.from(this.store.values()).filter((item) =>
      this.matchesFilter(item, filter as any),
    );
  }

  async findById(id: string): Promise<TDomain | null> {
    return this.store.get(id) || null;
  }

  async update(id: string, data: TUpdate): Promise<TDomain> {
    const existing = this.store.get(id);
    if (!existing) throw new Error('Not found');
    const updated = { ...existing, ...(data as any), id } as TDomain;
    this.store.set(id, updated);
    return updated;
  }

  async updateOrCreate(
    filter: Partial<TFilter> & { id?: string },
    data: TCreate,
  ): Promise<TDomain> {
    if (filter.id && this.store.has(filter.id)) {
      return this.update(filter.id, data as any);
    }
    return this.create(data);
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }
}
