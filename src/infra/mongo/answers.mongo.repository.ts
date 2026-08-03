import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  AnswerFilter,
  AnswerRepository,
  CreateAnswerInput,
  UpdateAnswerInput,
  AnswerManyFilter,
} from '../../domain/repositories/answer.repository';
import { Answer } from '../../domain/entities/answer';
import { AnswersDocument } from '../../answers/schemas/answers.schema';
import { mapProps, omitUndefined } from '../../base/mappers/object.mapper';

@Injectable()
export class AnswersMongoRepository implements AnswerRepository {
  constructor(
    @InjectModel('Answers')
    private readonly model: Model<AnswersDocument>,
  ) {}

  private toDomain(doc: any): Answer {
    const core: Omit<Answer, 'id' | 'createdAt' | 'updatedAt'> = mapProps(
      doc,
      {
        QUESTION_ID: 'questionId',
        CENTRO_ID: 'centroId',
        ANSWER: 'answer',
        QUIZ_ID: 'quizId',
        FORM_ID: 'formId',
        GROUP_KEY: 'groupKey',
        GROUP_INSTANCE_ID: 'groupInstanceId',
        GROUP_OCCURRENCE_ORDER: 'groupOccurrenceOrder',
        QUESTION_ORDER: 'questionOrder',
      },
    );
    return {
      id: doc._id?.toString(),
      ...core,
      createdAt: doc.createdAt ? new Date(doc.createdAt) : undefined,
      updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : undefined,
    };
  }

  private buildFilter(filter?: AnswerFilter): Record<string, any> {
    return mapProps(filter as any, {
      questionId: 'QUESTION_ID',
      centroId: 'CENTRO_ID',
      quizId: 'QUIZ_ID',
      answer: 'ANSWER',
      formId: 'FORM_ID',
      groupKey: 'GROUP_KEY',
      groupInstanceId: 'GROUP_INSTANCE_ID',
    });
  }

  async create(data: CreateAnswerInput): Promise<Answer> {
    const doc = new this.model(
      omitUndefined(
        mapProps(data as any, {
          questionId: 'QUESTION_ID',
          centroId: 'CENTRO_ID',
          answer: 'ANSWER',
          quizId: 'QUIZ_ID',
          formId: 'FORM_ID',
          groupKey: 'GROUP_KEY',
          groupInstanceId: 'GROUP_INSTANCE_ID',
          groupOccurrenceOrder: 'GROUP_OCCURRENCE_ORDER',
          questionOrder: 'QUESTION_ORDER',
        }),
      ),
    );
    const saved = await doc.save();
    return this.toDomain(saved);
  }

  async findAll(filter?: AnswerFilter): Promise<Answer[]> {
    const { dateFrom, dateTo, ...rest } = filter || {};
    const query = this.buildFilter(rest);
    if (dateFrom || dateTo) {
      query.updatedAt = {};
      if (dateFrom) query.updatedAt['$gte'] = dateFrom;
      if (dateTo) query.updatedAt['$lte'] = dateTo;
    }
    const docs = await this.model.find(query).lean();
    return docs.map((doc) => this.toDomain(doc));
  }

  async findById(id: string): Promise<Answer | null> {
    const doc = await this.model.findById(id).lean();
    return doc ? this.toDomain(doc) : null;
  }

  async update(id: string, data: UpdateAnswerInput): Promise<Answer> {
    const payload = omitUndefined(
      mapProps(data as any, {
        questionId: 'QUESTION_ID',
        centroId: 'CENTRO_ID',
        answer: 'ANSWER',
        quizId: 'QUIZ_ID',
        formId: 'FORM_ID',
        groupKey: 'GROUP_KEY',
        groupInstanceId: 'GROUP_INSTANCE_ID',
        groupOccurrenceOrder: 'GROUP_OCCURRENCE_ORDER',
        questionOrder: 'QUESTION_ORDER',
      }),
    );

    const updated = await this.model.findByIdAndUpdate(
      id,
      { $set: payload },
      { new: true, lean: true },
    );
    if (!updated) {
      throw new NotFoundException('Answer not found');
    }
    return this.toDomain(updated);
  }

  async updateOrCreate(
    filter: Partial<AnswerFilter> & { id?: string },
    data: CreateAnswerInput,
  ): Promise<Answer> {
    const query: Record<string, any> = this.buildFilter(filter);
    if (filter.id) {
      query['_id'] = filter.id;
    }
    const updateDoc = omitUndefined(
      mapProps(data as any, {
        questionId: 'QUESTION_ID',
        centroId: 'CENTRO_ID',
        answer: 'ANSWER',
        quizId: 'QUIZ_ID',
        formId: 'FORM_ID',
        groupKey: 'GROUP_KEY',
        groupInstanceId: 'GROUP_INSTANCE_ID',
        groupOccurrenceOrder: 'GROUP_OCCURRENCE_ORDER',
        questionOrder: 'QUESTION_ORDER',
      }),
    );

    const doc = await this.model
      .findOneAndUpdate(query, updateDoc, { new: true, upsert: true, lean: true })
      .exec();
    return this.toDomain(doc);
  }

  async delete(id: string): Promise<void> {
    await this.model.deleteOne({ _id: id }).lean();
  }

  async findByCentroIds(filter: AnswerManyFilter): Promise<Answer[]> {
    const { centroIds, dateFrom, dateTo, sortByUpdatedAt = true } = filter;
    const objectIds = centroIds
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));

    const query: any = {
      $or: [
        { CENTRO_ID: { $in: centroIds } }, // caso esteja salvo como string
        ...(objectIds.length ? [{ CENTRO_ID: { $in: objectIds } }] : []), // caso ObjectId
      ],
    };
    if (dateFrom || dateTo) {
      query.updatedAt = {};
      if (dateFrom) query.updatedAt['$gte'] = dateFrom;
      if (dateTo) query.updatedAt['$lte'] = dateTo;
    }
    const mongoQuery = this.model.find(query);
    if (sortByUpdatedAt) {
      mongoQuery.sort({ updatedAt: -1 });
    }
    const docs = await mongoQuery.lean();
    return docs.map((doc) => this.toDomain(doc));
  }
}
