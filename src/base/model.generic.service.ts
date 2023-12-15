import { Model } from 'mongoose';
import * as mongoose from 'mongoose';
import { CacheService } from '../services/cache.service';
import { Inject } from '@nestjs/common';

export class MongoGenericService<S, D> {
  constructor(
    protected readonly model: Model<S>,
    @Inject(CacheService) private readonly cacheService: CacheService,
  ) {}

  protected formatFieldParams(fieldParams: string) {
    if (!fieldParams) return;
    const params = fieldParams.split(',');
    let paramsParsed = '';

    for (let index = 0; index < params.length; index++) {
      const element = params[index];
      paramsParsed = paramsParsed.concat(element).concat(' ');
    }

    return paramsParsed;
  }

  private async getCached(key, saveMethod): Promise<any> {
    let item = await this.cacheService.get(key);

    if (!item) {
      item = await saveMethod();
      this.cacheService.set(key, item);
    }
    return item;
  }

  private async deleteCache() {
    const key = `${this.model.modelName}:`;
    await this.cacheService.delete(key);
  }

  protected async findAllMethod(fields, filterParams): Promise<any> {
    let query = this.model.find(filterParams);
    if (fields) {
      const selectedFields = this.formatFieldParams(fields);
      query = query.select(selectedFields);
    }
    return query.lean();
  }

  async findAll(filter?: any): Promise<S[]> {
    const key = `${this.model.modelName}:${JSON.stringify(filter)}`;

    const { fields, ...filterParams } = filter;

    // Aplicar regex aos filtros
    Object.keys(filterParams).forEach((key) => {
      filterParams[key] = new RegExp(filterParams[key], 'i'); // 'i' para busca insensível a maiúsculas e minúsculas
    });

    const method = async () => {
      return await this.findAllMethod(fields, filterParams);
    };
    const item = await this.getCached(key, method);

    return item;
  }

  async findOne(id: string): Promise<S> {
    const key = `${this.model.modelName}:${JSON.stringify({ id })}`;

    const methodById = async () => {
      return this.model.findById(id).lean();
    };

    const methodByString = async () => {
      const itemId = new mongoose.Types.ObjectId(id);
      return this.model.findById(itemId).lean();
    };
    let item = await this.getCached(key, methodById);

    if (!item) {
      item = await this.getCached(key, methodByString);
    }
    return item;
  }

  async create(data: D): Promise<S> {
    const newDocument = new this.model(data);
    const savedDocument = await newDocument.save();

    await this.deleteCache();
    return savedDocument.toObject();
  }

  async update(id: string, data: D): Promise<S> {
    const existingDocument = await this.model.findById(id).exec();

    if (!existingDocument) {
      throw new Error('Documento não encontrado');
    }

    Object.assign(existingDocument, data);
    const updatedDocument = await existingDocument.save();

    await this.deleteCache();
    return updatedDocument.toObject();
  }

  async delete(id: string): Promise<D> {
    await this.deleteCache();
    return this.model.deleteOne({ _id: id }).lean();
  }
}
