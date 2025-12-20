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

@Injectable()
export class AnswersMongoRepository implements AnswerRepository {
  constructor(
    @InjectModel('Answers')
    private readonly model: Model<AnswersDocument>,
  ) {}

  private toDomain(doc: any): Answer {
    return {
      id: doc._id?.toString(),
      questionId: doc.QUESTION_ID,
      centroId: doc.CENTRO_ID,
      answer: doc.ANSWER,
      quizId: doc.QUIZ_ID,
      createdAt: doc.createdAt ? new Date(doc.createdAt) : undefined,
      updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : undefined,
    };
  }

  private buildFilter(filter?: AnswerFilter): Record<string, any> {
    if (!filter) return {};
    const query: Record<string, any> = {};
    if (filter.questionId) query['QUESTION_ID'] = filter.questionId;
    if (filter.centroId) query['CENTRO_ID'] = filter.centroId;
    if (filter.quizId) query['QUIZ_ID'] = filter.quizId;
    if (filter.answer) query['ANSWER'] = filter.answer;
    return query;
  }

  async create(data: CreateAnswerInput): Promise<Answer> {
    const doc = new this.model({
      QUESTION_ID: data.questionId,
      CENTRO_ID: data.centroId,
      ANSWER: data.answer,
      QUIZ_ID: data.quizId,
    });
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
    const payload: Record<string, any> = {};
    if (data.questionId) payload['QUESTION_ID'] = data.questionId;
    if (data.centroId) payload['CENTRO_ID'] = data.centroId;
    if (data.answer) payload['ANSWER'] = data.answer;
    if (data.quizId) payload['QUIZ_ID'] = data.quizId;

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
    const updateDoc = {
      QUESTION_ID: data.questionId,
      CENTRO_ID: data.centroId,
      ANSWER: data.answer,
      QUIZ_ID: data.quizId,
    };

    const doc = await this.model
      .findOneAndUpdate(query, updateDoc, { new: true, upsert: true, lean: true })
      .exec();
    return this.toDomain(doc);
  }

  async delete(id: string): Promise<void> {
    await this.model.deleteOne({ _id: id }).lean();
  }
}
