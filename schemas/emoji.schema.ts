import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type EmojiDocument = Emoji & Document;

@Schema()
export class Emoji {
  @Prop()
  _id: string;

  @Prop()
  name: string;

  @Prop()
  server: string;

  @Prop()
  animated: boolean;
}

export const EmojiSchema = SchemaFactory.createForClass(Emoji);
