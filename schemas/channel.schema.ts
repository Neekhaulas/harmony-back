import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type ChannelDocument = Channel & Document;

@Schema()
export class Channel {
  @Prop()
  _id: number;

  @Prop()
  name: string;

  @Prop()
  server: number;
}

export const ChannelSchema = SchemaFactory.createForClass(Channel);
