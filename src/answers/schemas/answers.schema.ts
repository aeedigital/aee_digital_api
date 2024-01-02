import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AnswersDocument = HydratedDocument<Answer>;

@Schema()
export class Answer {
  @Prop({ type: String })
  CENTRO_ID: string;

  @Prop({ type: String })
  QUESTION_ID: string;

  @Prop({ type: String })
  ANSWER: string;
}

export const AnswersSchema = SchemaFactory.createForClass(Answer);
