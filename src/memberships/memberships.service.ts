import { Injectable } from '@nestjs/common';
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Membership, MembershipDocument } from "schemas/membership.schema";

@Injectable()
export class MembershipsService {
  constructor(
    @InjectModel(Membership.name)
    private readonly membershipModel: Model<MembershipDocument>
  ) { }

  async isInServer(user: number, server: number) {
    const membership = await this.membershipModel.findOne({ user, server });
    console.log(membership);
    if (membership === null) {
      return false;
    }
    return true;
  }

  async joinServer(user: number, server: number) {
    const isInServer = await this.isInServer(user, server);
    if (isInServer) {
      return false;
    }
    return this.membershipModel.create({
      user,
      server,
    });
  }

  async leaveServer(user: number, server: number) {
    return this.membershipModel.deleteOne({
      user,
      server,
    });
  }

  async getUserMemberships(user: number) {
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
    ]);
  }
}
