import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PassesDocument = HydratedDocument<Passes>;


@Schema({ timestamps: true }) // Automatically manages createdAt and updatedAt
export class Passes {
  @Prop({ type: String })
  user: string;

  @Prop({ type: String })
  pass: string;

  @Prop({ type: String })
  scope_id: string;

  @Prop({ type: [String] })
  groups: string[];

  @Prop({ default: null })
  lastLogged: Date;
}

export const PassesSchema = SchemaFactory.createForClass(Passes);
