import { HydratedDocument } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Forms } from '../../forms/schemas/forms.schema';
import mongoose from 'mongoose';

export type CadastroInfoDocument = HydratedDocument<CadastroInfoSchemaClass>;

@Schema({ timestamps: true })
export class CadastroInfoSchemaClass {
  @Prop({ required: true })
  START_DATE: string;

  @Prop({ required: true })
  END_DATE: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: Forms.name, required: true })
  FORM_ID: Forms;

  @Prop({ required: true, default: true })
  IS_ACTIVE: boolean;
}

export const CadastroInfoSchema = SchemaFactory.createForClass(CadastroInfoSchemaClass);
