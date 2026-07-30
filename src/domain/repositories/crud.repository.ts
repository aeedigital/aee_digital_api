export interface CrudRepository<TDomain, TCreate, TUpdate, TFilter = Record<string, any>> {
  create(data: TCreate): Promise<TDomain>;
  findAll(filter?: TFilter): Promise<TDomain[]>;
  findById(id: string): Promise<TDomain | null>;
  update(id: string, data: TUpdate): Promise<TDomain>;
  updateOrCreate(filter: Partial<TFilter> & { id?: string }, data: TCreate): Promise<TDomain>;
  delete(id: string): Promise<void>;
}
