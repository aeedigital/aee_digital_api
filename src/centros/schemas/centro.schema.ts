import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CentroDocument = HydratedDocument<Centro>;

import { FuncionamentoDto } from '../dto/create-centro.dto';

export type LocationStatus = 'CONFIRMADA' | 'APROXIMADA' | 'PENDENTE' | 'NAO_ENCONTRADA' | 'ERRO';

@Schema({ _id: false })
export class GeoPoint {
  @Prop({ type: String, enum: ['Point'], required: true })
  type: 'Point';

  @Prop({ type: [Number], required: true })
  coordinates: [number, number];
}

const GeoPointSchema = SchemaFactory.createForClass(GeoPoint);

@Schema({ _id: false })
export class CentroLocation {
  @Prop({ type: GeoPointSchema, required: false })
  PONTO?: GeoPoint;

  @Prop({
    type: String,
    enum: ['CONFIRMADA', 'APROXIMADA', 'PENDENTE', 'NAO_ENCONTRADA', 'ERRO'],
    required: true,
  })
  STATUS: LocationStatus;

  @Prop()
  PRECISAO?: string;

  @Prop({ min: 0, max: 1 })
  CONFIANCA?: number;

  @Prop()
  ORIGEM?: string;

  @Prop()
  PLACE_ID?: string;

  @Prop()
  ENDERECO_FORMATADO?: string;

  @Prop()
  ATUALIZADA_EM?: Date;

  @Prop({ select: false })
  ENDERECO_HASH: string;

  @Prop({ select: false })
  ERRO_CODIGO?: string;
}

const CentroLocationSchema = SchemaFactory.createForClass(CentroLocation);

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
  TELEFONE?: string;
  @Prop()
  SITE?: string;
  @Prop()
  STATUS: string;
  @Prop({ type: CentroLocationSchema })
  LOCALIZACAO?: CentroLocation;
}

export const CentroSchema = SchemaFactory.createForClass(Centro);

CentroSchema.index(
  { 'LOCALIZACAO.PONTO': '2dsphere' },
  {
    partialFilterExpression: {
      'LOCALIZACAO.PONTO.type': 'Point',
    },
  },
);
