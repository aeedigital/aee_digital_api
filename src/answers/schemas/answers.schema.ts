import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AnswersDocument = HydratedDocument<Answer>;

@Schema()
export class Answer {
  @Prop({ type: String })
  CENTRO_ID: string;

  @Prop({ type: String })
  QUID_ID: string;

  @Prop({ type: Boolean })
  Answer_ID: boolean;

  @Prop({ type: String })
  ANSWER: string;
}

export const AnswersSchema = SchemaFactory.createForClass(Answer);
