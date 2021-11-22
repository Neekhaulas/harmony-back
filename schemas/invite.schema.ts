import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type InviteDocument = Invite & Document;

@Schema()
export class Invite {
  @Prop()
  _id: number;

  @Prop()
  code: string;

  @Prop()
  server: number;

  @Prop()
  creator: number;

  @Prop()
  uses: number;

  @Prop()
  maxUses: number;

  @Prop()
  createdAt: Date;

  @Prop()
  expiresAt: Date;
}

export const InviteSchema = SchemaFactory.createForClass(Invite);
