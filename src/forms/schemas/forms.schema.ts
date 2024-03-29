import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Question } from '../../questions/schemas/questions.schema';
import mongoose, { HydratedDocument } from 'mongoose';

export type FormDocument = HydratedDocument<Forms>;

@Schema()
export class Pages {
  @Prop()
  NAME: string;

  @Prop({ type: String })
  ROLE: string;

  @Prop()
  QUIZES: Quizes[];
}
@Schema({ timestamps: true })
export class Forms {
  @Prop()
  NAME: string;

  @Prop()
  VERSION: number;

  @Prop()
  CREATEDBY: string;

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

export const FormSchema = SchemaFactory.createForClass(Forms);
