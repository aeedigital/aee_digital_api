import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AnswersDocument = HydratedDocument<Answer>;

@Schema({ timestamps: true }) // Automatically manages createdAt and updatedAt
export class Answer {
  @Prop({ type: String })
  CENTRO_ID: string;

  @Prop({ type: String })
  QUESTION_ID: string;

  @Prop({ type: String })
  ANSWER: string;

  @Prop({ type: String })
  QUIZ_ID: string;
}

export const AnswersSchema = SchemaFactory.createForClass(Answer);
