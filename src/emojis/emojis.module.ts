import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Emoji, EmojiSchema } from "schemas/emoji.schema";
import { EmojisService } from "./emojis.service";

@Module({
  imports: [MongooseModule.forFeature([{ name: Emoji.name, schema: EmojiSchema }])],
  providers: [EmojisService],
  exports: [EmojisService],
})
export class EmojisModule { }
