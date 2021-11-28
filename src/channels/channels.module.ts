import { forwardRef, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Channel, ChannelSchema } from "schemas/channel.schema";
import { RedisModule } from "src/redis/redis.module";
import { ServersModule } from "src/servers/servers.module";
import { ChannelsService } from "./channels.service";
import { ThrottlerModule } from "@nestjs/throttler";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Channel.name, schema: ChannelSchema }]),
    RedisModule,
    forwardRef(() => ServersModule),
    /* ThrottlerModule.forRoot({
      limit: 5,
      ttl: 60,
    }),*/
  ],
  providers: [ChannelsService],
  exports: [ChannelsService],
})
export class ChannelsModule { }
