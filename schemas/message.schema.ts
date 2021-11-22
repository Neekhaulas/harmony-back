import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type MessageDocument = Message & Document;

@Schema({
  timestamps: {
    createdAt: "createdAt",
    updatedAt: "updatedAt",
  },
})
export class Message {
  @Prop()
  _id: number;

  @Prop()
  owner: number;

  @Prop()
  channel: number;

  @Prop()
  content: string;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
