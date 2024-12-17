import { Model } from 'mongoose';
import * as mongoose from 'mongoose';
import { CacheService } from '../services/cache.service';
import { Inject } from '@nestjs/common';
import { ObjectId } from 'mongodb';
export class MongoGenericService<S, D> {
  constructor(
    protected readonly model: Model<S>,
    @Inject(CacheService) private readonly cacheService: CacheService,
  ) {
    this.listenToChanges();
  }

  async listenToChanges() {
    const changeStream = this.model.watch();

    changeStream.on('change', (change) => {
      console.log('Mudança detectada:', change);
      // Aqui você pode implementar a lógica para lidar com as mudanças.
      // Por exemplo, enviar uma notificação ou executar alguma ação específica.
      const modelName = change?.ns?.coll;
      this.deleteCache(modelName);
    });

    changeStream.on('error', (error) => {
      console.error('Erro no Change Stream:', error);
    });
  }

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

  formatSelectedFields(selectedFields) {
    if (!selectedFields) return {};

    const fields = selectedFields.split(',');
    return fields.reduce((acc, field) => {
      acc[field.trim()] = 1; // Inclui os campos; use 0 para excluir
      return acc;
    }, {});
  }

  private async getCached(key, saveMethod): Promise<any> {
    let item = await this.cacheService.get(key);

    if (!item) {
      item = await saveMethod();
      this.cacheService.set(key, item);
    }
    return item;
  }

  protected async deleteCache(modelName?: string) {
    const key = modelName
      ? `${modelName.toLowerCase()}:`
      : `${this.model.modelName.toLowerCase()}:`;

    await this.cacheService.delete(key);
  }

  protected async findAllMethod(
    fields,
    filterParams,
    sortBy: string,
  ): Promise<any> {
    try {
      let query = this.model.find(filterParams);
      if (fields) {
        const selectedFields = this.formatFieldParams(fields);
        query = query.select(selectedFields);
      }
  
      if (sortBy) {
        query = query.sort(sortBy);
      }
  
      return query.lean();
    } catch (error) {
      throw error;
    }
  }

  private isObjectId(value) {
    return ObjectId.isValid(value) && new ObjectId(value).toString() === value;
  }

  patchParams(filterParams) {
    const andConditions = [];
  
    if (Object.keys(filterParams).length > 0) {
      for (const key in filterParams) {
        if (filterParams.hasOwnProperty(key)) {
          const value = filterParams[key];
          if (value == undefined) {
            continue;
          }
          if (this.isObjectId(value)) {
            andConditions.push({
              $or: [{ [key]: value }, { [key]: new ObjectId(value) }],
            });
          } else if (typeof value === 'object' && !Array.isArray(value)) {
            // Presume que é um filtro avançado (como $gte, $lte)
            andConditions.push({ [key]: value });
          } else {
            andConditions.push({ [key]: value });
          }
        }
      }
      return { $and: andConditions };
    } else {
      return {};
    }
  }
  
  async findAll(filter?: any): Promise<S[]> {
    const key = `${this.model.modelName.toLowerCase()}:${JSON.stringify(
      filter,
    )}`;
  
    const { fields, dateFrom, dateTo, sortBy, ...filterParams } = filter;
  
    // Adicionar filtro de data, se necessário
    if (dateFrom || dateTo) {
      filterParams['createdAt'] = {};
      if (dateFrom) {
        filterParams['createdAt']['$gte'] = new Date(dateFrom);
      }
      if (dateTo) {
        filterParams['createdAt']['$lte'] = new Date(dateTo);
      }
    }
  
    const modifiedFilter = this.patchParams(filterParams);
  
    const method = async () => {
      const findResult = await this.findAllMethod(
        fields,
        modifiedFilter,
        sortBy,
      );
  
      return findResult;
    };
  
    const item = await this.getCached(key, method);
  
    return item;
  }

  async findOne(id: string): Promise<S> {
    const key = `${this.model.modelName.toLowerCase()}:${JSON.stringify({
      id,
    })}`;

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

  async updateOrCreate(filter: any, data: D): Promise<S> {
    await this.deleteCache();

    const modifiedFilter = this.patchParams(filter);

    const opcoes = { upsert: true, new: true };
    return this.model.findOneAndUpdate(modifiedFilter, data, opcoes).exec();
  }

  async delete(id: string): Promise<D> {
    await this.deleteCache();
    return this.model.deleteOne({ _id: id }).lean();
  }
}
