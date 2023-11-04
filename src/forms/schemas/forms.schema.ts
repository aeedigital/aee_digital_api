import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import * as mongoose from 'mongoose';


import { Question } from '../../questions/schemas/question.schema';

export type FormDocument = HydratedDocument<Form>;

@Schema()
export class Form {
  @Prop({ required: true })
  NAME: string;

  @Prop({ type: Number, default: 1 })
  VERSION: number;

  @Prop({ type: Date, default: Date.now })
  CREATEDAT: Date;

  @Prop({ type: String })
  CREATEDBY: string;

  @Prop({ required: true })
  PAGES: [
    {
      NAME: string;
      QUIZES: [
        {
          CATEGORY: string;
          QUESTIONS: [
            {
              @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }] })
  GROUP: Question[]
  // GROUP: [Question];
  IS_MULTIPLE: boolean;
},
          ];
        },
      ];
    },
  ];
}

export const FormSchema = SchemaFactory.createForClass(Form);
