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
    @Inject(CacheService) cacheService: CacheService, // Remova esta linha se não estiver usando o CacheService
  ) {
    super(FormModel, cacheService);
  }

  protected async findAllMethod(fields: any): Promise<any> {
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

    if (!fields || (fields && selectedFields.includes('PAGES'))) {
      query.populate({
        path: 'PAGES.QUIZES.QUESTIONS.GROUP',
        model: 'Questions', // O nome do modelo referenciado,
      });
    }
    return query.exec();
  }
}
