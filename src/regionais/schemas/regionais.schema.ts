import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type RegionalDocument = HydratedDocument<Regional>;

@Schema()
export class Regional {
  @Prop()
  NOME_REGIONAL: string;
  @Prop()
  PAIS: string;
  @Prop()
  COORDENADOR_ID: string;
}

export const RegionalSchema = SchemaFactory.createForClass(Regional);
