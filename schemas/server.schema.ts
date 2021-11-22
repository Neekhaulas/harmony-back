import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type ServerDocument = Server & Document;

@Schema()
export class Server {
  @Prop()
  _id: number;

  @Prop()
  name: string;

  @Prop()
  owner: number;

  @Prop()
  image: string;
}

export const ServerSchema = SchemaFactory.createForClass(Server);
