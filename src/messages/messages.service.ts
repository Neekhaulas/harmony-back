import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { CreateMessageDto } from "dto/message.dto";
import { Model } from "mongoose";
import { Message, MessageDocument } from "schemas/message.schema";

@Injectable()
export class MessagesService {
  constructor(
    @InjectModel(Message.name)
    private readonly messageModel: Model<MessageDocument>
  ) { }

  async create(createMessageDto: CreateMessageDto, channel: number, owner: number) {
    return this.messageModel.create({ ...createMessageDto, channel, owner });
  }

  async getByChannel(channelId: number) {
    return this.messageModel.find({ channel: channelId }).sort("_id").limit(50);
  }

  async get(id: number) {
    return this.messageModel.findOne({ _id: id });
  }

  async delete(id: number) {
    return this.messageModel.deleteOne({ _id: id });
  }

  async update(id: number, createMessageDto: CreateMessageDto) {
    return this.messageModel.findOneAndUpdate({ _id: id }, { $set: { ...createMessageDto } }, { new: true });
  }
}
