import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type ServerDocument = Server & Document;

@Schema()
export class Server {
  @Prop()
  _id: string;

  @Prop()
  name: string;

  @Prop()
  owner: string;

  @Prop()
  image: string;
}

export const ServerSchema = SchemaFactory.createForClass(Server);
