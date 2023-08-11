import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

import { Regional } from 'src/regionais/schemas/regionais.schema';

export type CentroDocument = HydratedDocument<Centro>;

import { FuncionamentoDto } from '../dto/create-centro.dto';



@Schema()
export class Centro {
  @Prop({ type: FuncionamentoDto })
  FUNCIONAMENTO: FuncionamentoDto;
  @Prop()
  NOME_CENTRO: string;
  @Prop()
  NOME_CURTO: string;
  @Prop()
  CNPJ_CENTRO: string;
  @Prop()
  DATA_FUNDACAO: string;
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Regional' })
  REGIONAL: Regional;
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

export const CentroSchema = SchemaFactory.createForClass(Centro);
