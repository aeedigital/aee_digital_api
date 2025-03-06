import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

import { Regional } from '../../regionais/schemas/regionais.schema';

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
  @Prop()
  STATUS: string;
}

export const CentroSchema = SchemaFactory.createForClass(Centro);
