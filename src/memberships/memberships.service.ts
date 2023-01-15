import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Membership, MembershipDocument } from "schemas/membership.schema";

@Injectable()
export class MembershipsService {
  constructor(
    @InjectModel(Membership.name)
    private readonly membershipModel: Model<MembershipDocument>
  ) { }

  async isInServer(user: string, server: string) {
    const membership = await this.membershipModel.findOne({ user, server });
    if (membership === null) {
      return false;
    }
    return true;
  }

  async joinServer(user: string, server: string) {
    const isInServer = await this.isInServer(user, server);
    if (isInServer) {
      return false;
    }
    return this.membershipModel.create({
      user,
      server,
    });
  }

  async leaveServer(user: string, server: string): Promise<any> {
    return this.membershipModel.deleteOne({
      user,
      server,
    });
  }

  async getUserMemberships(user: string) {
    return this.membershipModel.aggregate([
      {
        $match: {
          user,
        },
      },
      {
        $lookup: {
          from: "servers",
          localField: "server",
          foreignField: "_id",
          as: "server",
        },
      },
      {
        $project: {
          _id: 0,
          server: { $arrayElemAt: ["$server", 0] },
        },
      },
      {
        $replaceRoot: {
          newRoot: "$server",
        },
      },
      {
        $lookup: {
          from: "channels",
          localField: "_id",
          foreignField: "server",
          as: "channels",
        },
      },
      {
        $lookup: {
          from: "emojis",
          localField: "_id",
          foreignField: "server",
          as: "emojis",
        },
      },
    ]);
  }

  async getServerUsers(server: string) {
    const servers = await this.membershipModel.aggregate([
      {
        $match: {
          server,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $project: {
          _id: 0,
          user: { $arrayElemAt: ["$user", 0] },
        },
      },
      {
        $replaceRoot: {
          newRoot: "$user",
        },
      },
      {
        $project: {
          _id: 1,
          username: 1,
        },
      },
    ]);
    return servers;
  }
}
