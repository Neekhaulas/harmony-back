import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Invite, InviteDocument } from "schemas/invite.schema";

@Injectable()
export class InvitesService {
  constructor(
    @InjectModel(Invite.name)
    private readonly inviteModel: Model<InviteDocument>
  ) { }

  async get(code: string) {
    const invites = await this.inviteModel.aggregate([
      {
        $match: {
          code,
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
          code: 1,
          server: { $arrayElemAt: ["$server", 0] },
        },
      },
    ]);
    return invites[0] ?? null;
  }

  async create(server: number, code: string) {
    return this.inviteModel.create({
      server,
      code,
    });
  }
}
