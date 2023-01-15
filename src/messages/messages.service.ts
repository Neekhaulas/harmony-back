import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Decimal128 } from "bson";
import { CreateMessageDto } from "dto/message.dto";
import { Model } from "mongoose";
import { Message, MessageDocument } from "schemas/message.schema";

@Injectable()
export class MessagesService {
  constructor(
    @InjectModel(Message.name)
    private readonly messageModel: Model<MessageDocument>
  ) { }

  async create(createMessageDto: CreateMessageDto, channel: string, owner: string) {
    return this.messageModel.create({ ...createMessageDto, channel, owner });
  }

  async getByChannel(channelId: string, before: string | null = null, after: string | null = null) {
    if (before !== null) {
      return this.messageModel.aggregate([
        {
          $match: {
            _id: { $lt: before },
            channel: channelId,
          },
        },
        {
          $sort: {
            _id: -1,
          },
        },
        {
          $limit: 50,
        },
      ]);
    } else if (after !== null) {
      return this.messageModel.aggregate([
        {
          $match: {
            _id: { $gt: after },
            channel: channelId,
          },
        },
        {
          $sort: {
            _id: -1,
          },
        },
        {
          $limit: 50,
        },
      ]);
    } else {
      return this.messageModel.aggregate([
        {
          $match: {
            channel: channelId,
          },
        },
        {
          $sort: {
            _id: -1,
          },
        },
        {
          $limit: 50,
        },
        {
          $addFields: {
            _id: {
              $toString: {
                $toLong: "$_id",
              },
            },
          },
        },
      ]);
    }
  }

  async get(id: string) {
    return this.messageModel.findOne({ _id: id });
  }

  async delete(id: string): Promise<any> {
    return this.messageModel.deleteOne({ _id: id });
  }

  async update(id: string, createMessageDto: CreateMessageDto) {
    return this.messageModel.findOneAndUpdate({ _id: id }, { $set: { ...createMessageDto } }, { new: true });
  }
}
