import { Model, Document } from 'mongoose';
import { CacheService } from '../services/cache.service';
import { Inject } from '@nestjs/common';
import { ObjectId } from 'mongodb';

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

  async getCached(key, saveMethod): Promise<any> {
    let item = await this.cacheService.get(key);

    if (!item) {
      item = await saveMethod();
      this.cacheService.set(key, item);
    }
    return item;
  }

  convertfilterParams(filterParams) {
    const keys = Object.keys(filterParams);
    const convertedValues = {};

    for (const key of keys) {
      const value = filterParams[key];
      if (typeof value === 'string' && ObjectId.isValid(value)) {
        // convertedValues[key] = ObjectId(${value})
        convertedValues[key] = { $regex: value };
      } else {
        convertedValues[key] = value;
      }
    }
    return convertedValues;
  }

  async findAll(filter?: any): Promise<T[]> {
    const { fields, ...filterParams } = filter;

    const filterParamsConverted = filterParams;//this.convertfilterParams(filterParams);

    const instance = this;
    const method = await function () {
      let query = instance.model.find(filterParamsConverted);
      if (fields) {
        const selectedFields = instance.formatFieldParams(fields);
        query = query.select(selectedFields);
      }
      return query.exec();
    };

    let paramsString = ' ';

    if (filterParams) {
      const keys = Object.keys(filterParams);
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
    const item = await this.getCached(key, this.model.findById(id).exec());

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
