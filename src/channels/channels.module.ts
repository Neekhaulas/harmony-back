import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Channel, ChannelSchema } from "schemas/channel.schema";
import { ChannelsService } from "./channels.service";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Channel.name, schema: ChannelSchema }]),
  ],
  providers: [ChannelsService],
  exports: [ChannelsService],
})
export class ChannelsModule {}
