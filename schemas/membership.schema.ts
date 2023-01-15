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
  _id: string;

  @Prop()
  user: string;

  @Prop()
  server: string;

  @Prop()
  roles: [string];

  @Prop()
  joinedAt: Date;
}

export const MembershipSchema = SchemaFactory.createForClass(Membership);
