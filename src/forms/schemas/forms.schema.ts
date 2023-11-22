import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Question } from '../../questions/schemas/questions.schema';
import mongoose, { HydratedDocument } from 'mongoose';

export type FormDocument = HydratedDocument<Form>;

@Schema()
export class Pages {
  @Prop()
  NAME: string;

  @Prop()
  QUIZES: Quizes[];
}
// @Schema({ timestamps: true })
@Schema()
export class Form {
  @Prop()
  NAME: string;

  @Prop()
  version: number;

  @Prop()
  createdBy: string;

  @Prop()
  PAGES: Pages[];
}

@Schema()
export class Quizes {
  @Prop()
  CATEGORY: string;

  @Prop()
  QUESTIONS: Questions[];
}

@Schema()
export class Questions {
  @Prop([{ type: mongoose.Schema.Types.ObjectId, ref: 'Questions' }])
  GROUP: Question[];
  @Prop()
  IS_MULTIPLE: boolean;
}

export const FormSchema = SchemaFactory.createForClass(Form);
