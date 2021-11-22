import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type EmojiDocument = Emoji & Document;

@Schema()
export class Emoji {
  @Prop()
  _id: number;

  @Prop()
  name: string;

  @Prop()
  server: number;

  @Prop()
  animated: boolean;
}

export const EmojiSchema = SchemaFactory.createForClass(Emoji);
