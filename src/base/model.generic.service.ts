import { Model, Document } from 'mongoose';
import { CacheService } from '../services/cache.service';
import { Inject } from '@nestjs/common';

export class MongoGenericService<T extends Document> {
  constructor(
    protected readonly model: Model<T>,
    @Inject(CacheService) private readonly cacheService: CacheService,
  ) {}

  private formatFieldParams(fieldParams: string) {
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

  async findAll(filter?: any): Promise<T[]> {
    const { fields, ...filterParams } = filter;

    const method = async () => {
      let query = this.model.find(filterParams);
      if (fields) {
        const selectedFields = this.formatFieldParams(fields);
        query = query.select(selectedFields);
      }
      return query.exec();
    };

    let paramsString = '';

    const keys = Object.keys(filterParams);
    if (keys.length > 0) {
      const values = Object.values(filterParams);

      paramsString = `${keys.toString()}:${values.toString()}`;
    }

    const key = `${this.model.modelName}:all:${
      fields?.toString() || ''
    }:${paramsString}`;
    const item = await this.getCached(key, method);

    return item;
  }

  async findOne(id: string): Promise<T> {
    const key = `${this.model.modelName}:${id}`;
    
    const method = async () => {
      return this.model.findById(id).exec();
    };
    const item = await this.getCached(key, method);

    return item;
  }

  async create(data: T): Promise<T> {
    const newDocument = new this.model(data);
    return newDocument.save();
  }

  async update(id: string, data: T): Promise<T> {
    const existingDocument = await this.model.findById(id).exec();

    if (!existingDocument) {
      throw new Error('Documento não encontrado');
    }

    Object.assign(existingDocument, data);
    return existingDocument.save();
  }

  async delete(id: string): Promise<T> {
    return this.model.findByIdAndRemove(id).exec();
  }
}
