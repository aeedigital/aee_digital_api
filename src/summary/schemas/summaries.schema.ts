import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Forms } from '../../forms/schemas/forms.schema';
import { CreateCentroDto } from '../../centros/dto/create-centro.dto';
import { Question } from '../../questions/schemas/questions.schema';
import mongoose, { HydratedDocument } from 'mongoose';

export type SummariesDocument = HydratedDocument<Summaries>;

@Schema()
class SummaryQuestion {
  @Prop()
  ANSWER: string;
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Questions' })
  QUESTION: Question;
  @Prop()
  ANSWER_ID?: string;
  @Prop()
  GROUP_KEY?: string;
  @Prop()
  GROUP_INSTANCE_ID?: string;
  @Prop()
  OCCURRENCE_ORDER?: number;
  @Prop()
  QUESTION_ORDER?: number;
  @Prop()
  QUESTION_LABEL?: string;
  @Prop()
  ANSWER_TYPE?: string;
}

@Schema({ timestamps: true })
export class Summaries {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Forms' })
  FORM_ID: Forms;
  @Prop()
  CENTRO_ID: CreateCentroDto;
  @Prop([{ type: SummaryQuestion }])
  QUESTIONS: [SummaryQuestion];
  @Prop()
  validatedByCoordAt?: Date;
  @Prop({ type: Number })
  schemaVersion?: number;
  @Prop({ type: mongoose.Schema.Types.Mixed })
  FORM_SNAPSHOT?: Record<string, any>;
  @Prop({ type: mongoose.Schema.Types.Mixed })
  COORDINATION_SNAPSHOT?: Record<string, any>;
  @Prop({ type: mongoose.Schema.Types.Mixed })
  ATENDIMENTOS?: Record<string, any>;
  @Prop({ type: Boolean })
  DIVULGACAO_AUTORIZADA?: boolean;
  @Prop({ type: mongoose.Schema.Types.Mixed })
  reconstruction?: Record<string, any>;
}

export const SummariesSchema = SchemaFactory.createForClass(Summaries);

SummariesSchema.index({ CENTRO_ID: 1, createdAt: -1 });
SummariesSchema.index({ FORM_ID: 1, createdAt: -1 });
SummariesSchema.index({ schemaVersion: 1, createdAt: -1 });
