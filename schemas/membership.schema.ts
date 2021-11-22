import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type MembershipDocument = Membership & Document;

@Schema({
  timestamps: {
    createdAt: "joinedAt",
  },
})
export class Membership {
  @Prop()
  _id: number;

  @Prop()
  user: number;

  @Prop()
  server: number;

  @Prop()
  roles: [number];

  @Prop()
  joinedAt: Date;
}

export const MembershipSchema = SchemaFactory.createForClass(Membership);
