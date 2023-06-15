import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
// import { HydratedDocument } from 'mongoose';
import { Document } from 'mongoose';

// export type CentroDocument = HydratedDocument<Centro>;

@Schema()
export class Centro {
  // FUNCIONAMENTO: any;
  @Prop()
  NOME_CENTRO: string;
  @Prop()
  NOME_CURTO: string;
  @Prop()
  CNPJ_CENTRO: string;
  @Prop()
  DATA_FUNDACAO: string;
  @Prop()
  REGIONAL: string;
  @Prop()
  ENDERECO: string;
  @Prop()
  CEP: string;
  @Prop()
  BAIRRO: string;
  @Prop()
  CIDADE: string;
  @Prop()
  ESTADO: string;
  @Prop()
  PAIS: string;
}

export type CentroDocument = Centro & Document;

export const CentroSchema = SchemaFactory.createForClass(Centro);
