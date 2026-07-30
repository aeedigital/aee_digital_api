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
import { Question } from '../../questions/schemas/questions.schema';

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

  private populateGroups(query: any) {
    return query.populate({
      path: 'PAGES.QUIZES.QUESTIONS.GROUP',
      model: 'Questions',
    });
  }

  private mapGroupQuestion(question?: Partial<Question> & { _id?: any }) {
    if (!question) return undefined;
    const id = extractId(question);
    // When not populated, we only have an id string/ObjectId
    if (
      typeof question === 'string' ||
      typeof question === 'number' ||
      (question as any)?._id === undefined
    ) {
      return { _id: id };
    }

    const source: any = (question as any)?._doc || question;
    return omitUndefined({
      _id: id,
      QUESTION: source.QUESTION,
      ANSWER_TYPE: source.ANSWER_TYPE,
      IS_REQUIRED: source.IS_REQUIRED,
      IS_MULTIPLE: source.IS_MULTIPLE,
      PRESET_VALUES: source.PRESET_VALUES,
      ROLE: source.ROLE,
      __v: source.__v,
    });
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
            group: (question.GROUP || [])
              .map((g: any) => this.mapGroupQuestion(g))
              .filter((g: any) => g !== undefined),
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
            GROUP: question.group?.map((g) => extractId(g)),
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
      this.populateGroups(query);
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

  async findById(id: string): Promise<Form | null> {
    const cacheKey = `${this.model.modelName.toLowerCase()}:${id}`;
    const cached = await this.cacheService.get(cacheKey);
    if (cached) return this.toDomain(cached);

    const doc = await this.populateGroups(this.model.findById(id)).lean();
    if (doc) {
      await this.cacheService.set(cacheKey, doc);
    }
    return doc ? this.toDomain(doc) : null;
  }

  async update(id: string, data: UpdateFormInput): Promise<Form> {
    const updated = await this.populateGroups(
      this.model.findByIdAndUpdate(
        id,
        { $set: this.toPersistence(data) },
        { new: true, lean: true },
      ),
    ).exec();
    if (!updated) {
      throw new NotFoundException('Form not found');
    }
    await this.cacheService.set(`${this.model.modelName.toLowerCase()}:${id}`, updated);
    return this.toDomain(updated);
  }
}
