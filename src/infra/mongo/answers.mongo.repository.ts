import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  AnswerFilter,
  AnswerRepository,
  CreateAnswerInput,
  UpdateAnswerInput,
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
        }),
      ),
    );
    const saved = await doc.save();
    return this.toDomain(saved);
  }

  async findAll(filter?: AnswerFilter): Promise<Answer[]> {
    const query = this.buildFilter(filter);
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
}
