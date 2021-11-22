import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { ChannelDto } from "dto/channel.dto";
import { Model } from "mongoose";
import { Channel, ChannelDocument } from "schemas/channel.schema";

@Injectable()
export class ChannelsService {
  constructor(
    @InjectModel(Channel.name)
    private readonly channelModel: Model<ChannelDocument>
  ) { }

  async get(channelId: number): Promise<Channel> {
    return this.channelModel.findOne({ _id: channelId });
  }

  async createChannel(channelDto: ChannelDto, server: number): Promise<Channel> {
    return await this.channelModel.create({
      ...channelDto,
      server,
    });
  }
}
