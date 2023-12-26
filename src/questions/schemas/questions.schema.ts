import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type QuestionsDocument = HydratedDocument<Question>;

@Schema()
export class Question {
  @Prop({ type: String })
  QUESTION: string;

  @Prop({ type: String })
  ANSWER_TYPE: string;

  @Prop({ type: Boolean })
  IS_REQUIRED: boolean;

  @Prop({ type: String })
  IS_MULTIPLE: string;

  @Prop({ type: [String] })
  PRESET_VALUES: string[];

  @Prop({ type: String })
  ROLE: string;
}

export const QuestionsSchema = SchemaFactory.createForClass(Question);
