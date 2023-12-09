import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { Forms } from '../../forms/schemas/forms.schema';
import { CreateCentroDto } from '../../centros/dto/create-centro.dto';
import { Question } from '../../questions/schemas/questions.schema';

export type SummariesDocument = HydratedDocument<Summaries>;

@Schema()
export class SummaryQuestion {
  @Prop()
  ANSWER: string;
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Questions' })
  QUESTION: Question;
}

@Schema({ timestamps: true })
export class Summaries {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Forms' })
  FORM_ID: Forms;
  @Prop()
  CENTRO_ID: CreateCentroDto;
  @Prop([{ type: SummaryQuestion }])
  QUESTIONS: [SummaryQuestion];
}

export const SummariesSchema = SchemaFactory.createForClass(Summaries);
