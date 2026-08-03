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

  @Prop({ type: String })
  FORM_ID?: string;

  @Prop({ type: String })
  GROUP_KEY?: string;

  @Prop({ type: String })
  GROUP_INSTANCE_ID?: string;

  @Prop({ type: Number })
  GROUP_OCCURRENCE_ORDER?: number;

  @Prop({ type: Number })
  QUESTION_ORDER?: number;
}

export const AnswersSchema = SchemaFactory.createForClass(Answer);

AnswersSchema.index({ CENTRO_ID: 1, FORM_ID: 1, GROUP_INSTANCE_ID: 1 });
