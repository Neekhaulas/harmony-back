import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type RoleDocument = Role & Document;

@Schema()
export class Role {
  @Prop()
  _id: number;

  @Prop()
  name: string;

  @Prop()
  server: number;

  @Prop()
  perimissions: number;
}

export const RoleSchema = SchemaFactory.createForClass(Role);
