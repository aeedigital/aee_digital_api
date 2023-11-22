import { Model } from 'mongoose';
import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CacheService } from '../services/cache.service';

import { FormDocument } from './schemas/forms.schema';
import { MongoGenericService } from '../base/model.generic.service';

@Injectable()
export class FormService extends MongoGenericService<FormDocument> {
  private _populateOnFind: string[];

  constructor(
    @InjectModel('Forms')
    protected readonly FormModel: Model<FormDocument>,
    @Inject(CacheService) cacheService: CacheService,
  ) {
    super(FormModel, cacheService);
    this._populateOnFind = ['PAGES.QUIZES.QUESTIONS.GROUP'];
  }

  protected async findAllMethod(fields: any, filterParams: any): Promise<any> {
    // return this.model.find().populate(this._populateOnFind).exec();
    const selectedFields = this.formatFieldParams(fields);

    const query = this.model.find();

    if (fields) {
      const fieldsToSelect = fields.split(' ').reduce((acc, field) => {
        acc[field] = 1;
        return acc;
      }, {});
      query.select(fieldsToSelect);
    }

    query.find().select(selectedFields);

    if (fields && selectedFields.includes('PAGES')) {
      query.populate({
        path: 'PAGES.QUIZES.QUESTIONS.GROUP',
        model: 'Questions', // O nome do modelo referenciado,
      });
    }
    return query.exec();

    // if (fields) {
    //   const selectedFields = this.formatFieldParams(fields);
    //   query = query.select(selectedFields);
    // }
    // return query.exec();
  }
}
