import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PessoasDocument = HydratedDocument<Pessoas>;

@Schema()
export class Pessoas {
  @Prop({ type: String })
  NOME: string;

  @Prop({ type: String })
  'E-MAIL': string;

  @Prop({ type: String })
  CELULAR: string;
}

export const PessoasSchema = SchemaFactory.createForClass(Pessoas);
