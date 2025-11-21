import { Model } from 'mongoose';
import * as mongoose from 'mongoose';
import { CacheService } from '../services/cache.service';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { format } from './dateFormater.helper';

@Injectable()
export class MongoGenericService<S, D, U = D> {
  private readonly logger = new Logger('MongoGenericService');
  shouldUseCache: boolean;


  constructor(
    protected readonly model: Model<S>,
    protected readonly cacheService: CacheService,
  ) {
    this.listenToChanges();
    this.shouldUseCache = false;;
  }

  async listenToChanges() {
    const changeStream = this.model.watch();

    changeStream.on('change', (change) => {
      console.log('Mudança detectada:', change);
      const modelName = change?.ns?.coll;
      // this.cacheService.invalidateModelCache(modelName); // Agora o CacheService cuida da invalidação
    });

    changeStream.on('error', (error) => {
      console.error('Erro no Change Stream:', error);
    });
  }

  private async getCached(key, saveMethod): Promise<any> {
    let item = await this.cacheService.get(key);

    if (!item) {
      item = await saveMethod();
      await this.cacheService.set(key, item);
    }
    return item;
  }

  protected formatFieldParams(fieldParams: string) {
    if (!fieldParams) return;
    const params = fieldParams.split(',');
    return params.join(' ');
  }

  protected async findAllMethod(fields, filterParams, sortBy: string): Promise<any> {
    let query = this.model.find(filterParams);
    if (fields) {
      const selectedFields = this.formatFieldParams(fields);
      query = query.select(selectedFields);
    }
    if (sortBy) {
      query = query.sort(sortBy);
    }
    return query.lean();
  }

  private isObjectId(value) {
    return ObjectId.isValid(value) && new ObjectId(value).toString() === value;
  }

  patchParams(filterParams) {
    const andConditions = [];

    for (const key in filterParams) {
        if (filterParams.hasOwnProperty(key)) {
            let value = filterParams[key];

            // Se o valor contém vírgula, transforma em array
            if (typeof value === 'string' && value.includes(',')) {
                const valuesArray = value.split(',').map(v => v.trim());
                andConditions.push({
                    $or: valuesArray.map(v => ({ [key]: v }))
                });
            } else if (this.isObjectId(value)) {
                andConditions.push({
                    $or: [{ [key]: value }, { [key]: new ObjectId(value) }]
                });
            } else if (typeof value === 'object' && !Array.isArray(value)) {
                andConditions.push({ [key]: value });
            } else {
                andConditions.push({ [key]: value });
            }
        }
    }

    return { $and: andConditions };
}

  async findAll(filter?: any): Promise<S[]> {
    const key = `${this.model.modelName.toLowerCase()}:all:${JSON.stringify(filter)}`;

    const { fields, dateFrom, dateTo, sortBy, ...filterParams } = filter || {};

    if (dateFrom || dateTo) {
      filterParams['createdAt'] = {};
      if (dateFrom) {
        filterParams['createdAt']['$gte'] = format(dateFrom, 'dd/mm/yyyy');
      }
      if (dateTo) {
        filterParams['createdAt']['$lte'] = format(dateTo, 'dd/mm/yyyy');
      }
    }

    const modifiedFilter = this.patchParams(filterParams);

    const method = async () => {
      const findResult = await this.findAllMethod(fields, modifiedFilter, sortBy);
      return findResult;
    };

    return this.getCached(key, method);
  }

  async findOne(id: string): Promise<S> {
    const key = `${this.model.modelName.toLowerCase()}:${id}`;

    const methodById = async () => {
      return this.model.findById(id).lean();
    };

    let item = await this.getCached(key, methodById);

    if (!item) {
      // Tenta recuperar do cache da lista
      const cacheAllKey = `${this.model.modelName.toLowerCase()}:all`;
      const cachedList = await this.cacheService.get(cacheAllKey);
      if (cachedList) {
        item = cachedList.find((doc) => doc['_id'].toString() === id);
        if (item) {
          await this.cacheService.set(key, item);
        }
      }
    }

    return item;
  }

  async create(data: D): Promise<S> {
    const newDocument = new this.model(data);
    const savedDocument = await newDocument.save();

    // Invalidação automática gerenciada pelo CacheService
    await this.cacheService.set(`${this.model.modelName.toLowerCase()}:${savedDocument._id}`, savedDocument);

    return savedDocument.toObject();
  }

  async update(id: string, data: U | D): Promise<S> {
    const existingDocument = await this.model.findById(id).exec();
    if (!existingDocument) {
      throw new Error('Documento não encontrado');
    }

    Object.assign(existingDocument, data);
    const updatedDocument = await existingDocument.save();

    // Atualização automática do cache
    await this.cacheService.set(`${this.model.modelName.toLowerCase()}:${id}`, updatedDocument);

    return updatedDocument.toObject();
  }

  async updateOrCreate(filter: any, data: D): Promise<S> {
    const modifiedFilter = this.patchParams(filter);
    const options = { upsert: true, new: true };

    const document = await this.model.findOneAndUpdate(modifiedFilter, data, options).exec();

    // Atualização automática do cache
    await this.cacheService.set(`${this.model.modelName.toLowerCase()}:${document._id}`, document);

    return document;
  }

  async delete(id: string): Promise<any> {
    await this.model.deleteOne({ _id: id }).lean();
    await this.cacheService.delete(`${this.model.modelName.toLowerCase()}:${id}`);
  }
}