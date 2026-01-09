import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  CreateFormInput,
  FormFilter,
  FormRepository,
  UpdateFormInput,
} from '../../domain/repositories/form.repository';
import { Form } from '../../domain/entities/form';
import { FormDocument } from '../../forms/schemas/forms.schema';
import { CacheService } from '../../services/cache.service';
import { BaseMongoRepository } from './base.mongo.repository';
import { extractId } from '../../base/mappers/mongo-id.mapper';
import { mapProps, omitUndefined } from '../../base/mappers/object.mapper';

@Injectable()
export class FormsMongoRepository
  extends BaseMongoRepository<Form, CreateFormInput, UpdateFormInput, FormFilter>
  implements FormRepository
{
  constructor(
    @InjectModel('Forms') protected readonly model: Model<FormDocument>,
    protected readonly cacheService: CacheService,
  ) {
    super(model, cacheService);
  }

  protected toDomain(doc: any): Form {
    const core: Omit<Form, 'id' | 'createdAt' | 'updatedAt' | 'pages'> = mapProps(
      doc,
      {
        NAME: 'name',
        VERSION: 'version',
        CREATEDBY: 'createdBy',
      },
    );
    return {
      id: doc._id?.toString(),
      ...core,
      pages: (doc.PAGES || []).map((page: any) => ({
        name: page.NAME,
        role: page.ROLE,
        quizes: (page.QUIZES || []).map((quiz: any) => ({
          category: quiz.CATEGORY,
          questions: (quiz.QUESTIONS || []).map((question: any) => ({
            group: (question.GROUP || []).map((g: any) => extractId(g)),
            isMultiple: question.IS_MULTIPLE,
          })),
        })),
      })),
      createdAt: doc.createdAt ? new Date(doc.createdAt) : undefined,
      updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : undefined,
    };
  }

  protected buildFilter(filter?: FormFilter): Record<string, any> {
    return mapProps(filter as any, {
      name: 'NAME',
      version: 'VERSION',
      createdBy: 'CREATEDBY',
      fields: 'fields',
    });
  }

  protected toPersistence(data: CreateFormInput | UpdateFormInput) {
    const payload = mapProps(data as any, {
      name: 'NAME',
      version: 'VERSION',
      createdBy: 'CREATEDBY',
    });
    return omitUndefined({
      ...payload,
      PAGES: data.pages?.map((page) => ({
        NAME: page.name,
        ROLE: page.role,
        QUIZES: page.quizes?.map((quiz) => ({
          CATEGORY: quiz.category,
          QUESTIONS: quiz.questions?.map((question) => ({
            GROUP: question.group,
            IS_MULTIPLE: question.isMultiple,
          })),
        })),
      })),
    });
  }

  protected async findAllMethod(
    fields: any,
    filterParams: any,
    sortBy: string,
  ): Promise<any> {
    // preserve populate/sort behavior from legacy service
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
        model: 'Questions',
      });
    }

    if (sortBy) {
      const sortByParams = sortBy.split(',');
      const sortParams = {};
      sortByParams.forEach((sortByItem) => {
        const sortParamProperties = sortByItem.split(':');
        const sortParam = sortParamProperties[0];
        const sortOrder = sortParamProperties[1];

        (sortParams as any)[sortParam] = sortOrder === 'asc' ? 1 : -1;
      });
      query.sort(sortParams);
    }

    return query.lean();
  }

  async update(id: string, data: UpdateFormInput): Promise<Form> {
    const updated = await this.model
      .findByIdAndUpdate(id, { $set: this.toPersistence(data) }, { new: true, lean: true })
      .exec();
    if (!updated) {
      throw new NotFoundException('Form not found');
    }
    return this.toDomain(updated);
  }
}
