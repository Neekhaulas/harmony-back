import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { ChannelDto } from "dto/channel.dto";
import { Model } from "mongoose";
import { Channel, ChannelDocument } from "schemas/channel.schema";
import { RedisService } from "src/redis/redis.service";
import { ServersService } from "src/servers/servers.service";

@Injectable()
export class ChannelsService {
  constructor(
    @InjectModel(Channel.name)
    private readonly channelModel: Model<ChannelDocument>,
    private readonly serversService: ServersService,
    private readonly redisService: RedisService
  ) { }

  async get(channelId: number): Promise<Channel> {
    return this.channelModel.findOne({ _id: channelId });
  }

  async createChannel(channelDto: ChannelDto, server: number): Promise<Channel> {
    const newChannel = await this.channelModel.create({
      ...channelDto,
      server,
    });
    this.serversService.get(server).then((result) => {
      this.redisService.getClient().publish(`server.${result._id}`, JSON.stringify({ event: 'CHANNEL_CREATE', data: newChannel }));
    });
    return newChannel;
  }
}
