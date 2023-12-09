import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PassesDocument = HydratedDocument<Passes>;

@Schema()
export class Passes {
  @Prop({ type: String })
  user: string;

  @Prop({ type: String })
  pass: string;

  @Prop({ type: String })
  scope_id: string;

  @Prop({ type: [String] })
  groups: string[];
}

export const PassesSchema = SchemaFactory.createForClass(Passes);
