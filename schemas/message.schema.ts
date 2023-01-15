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
  _id: string;

  @Prop()
  owner: string;

  @Prop()
  channel: string;

  @Prop()
  content: string;

  @Prop()
  attachments: Array<any>;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
