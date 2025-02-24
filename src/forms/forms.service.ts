import { Model } from 'mongoose';
import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { FormDocument } from './schemas/forms.schema';
import { CreateFormDto } from './dto/create-form.dto';
import { MongoGenericService } from '../base/model.generic.service';
import { CacheService } from '../services/cache.service';

@Injectable()
export class FormService extends MongoGenericService<
  FormDocument,
  CreateFormDto
> {
  private _populateOnFind: string[];

  constructor(
    @InjectModel('Forms')
    protected readonly FormModel: Model<FormDocument>,
    protected readonly cacheService: CacheService, // Remova esta linha se não estiver usando o CacheService
  ) {
    super(FormModel, cacheService);
  }

  protected async findAllMethod(
    fields: any,
    filterParams: any,
    sortBy: string,
  ): Promise<any> {
    const selectedFields = this.formatFieldParams(fields);

    const query = this.model.find(filterParams);

    if (fields) {
      const fieldsToSelect = fields.split(' ').reduce((acc, field) => {
        acc[field] = 1;
        return acc;
      }, {});
      query.select(fieldsToSelect);
    }

    query.select(selectedFields);

    if (!fields || (fields && selectedFields.includes('PAGES'))) {
      query.populate({
        path: 'PAGES.QUIZES.QUESTIONS.GROUP',
        model: 'Questions', // O nome do modelo referenciado,
      });
    }

    if (sortBy) {
      const sortByParams = sortBy.split(',');
      const sortParams = {};
      sortByParams.forEach((sortByItem) => {
        const sortParamProperties = sortByItem.split(':');
        const sortParam = sortParamProperties[0];
        const sortOrder = sortParamProperties[1];

        sortParams[sortParam] = sortOrder === 'asc' ? 1 : -1;
      });
      query.sort(sortParams);
    }

    return query.lean();
  }
}
