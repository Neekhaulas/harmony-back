import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Server, ServerDocument } from "schemas/server.schema";
import { ServerDto } from "dto/server.dto";

@Injectable()
export class ServersService {
  constructor(
    @InjectModel(Server.name)
    private readonly serverModel: Model<ServerDocument>
  ) { }

  async createServer(createServerDto: ServerDto, owner: number): Promise<Server> {
    const createdServer = await this.serverModel.create({
      ...createServerDto,
      owner: owner,
    });
    return createdServer;
  }

  async get(serverId: number): Promise<Server | null> {
    const server = await this.serverModel.aggregate([
      {
        $match: {
          _id: serverId,
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
    return server[0] ?? null;
  }

  async getServers(): Promise<Server[]> {
    const servers = await this.serverModel.aggregate([
      {
        $lookup: {
          from: "channels",
          localField: "_id",
          foreignField: "server",
          as: "channels",
        },
      },
    ]);
    return servers;
  }

  async deleteServer(id: number) {
    return await this.serverModel.deleteOne({ id });
  }

  async update(id: number, data: any) {
    return await this.serverModel.updateOne({ _id: id }, { $set: data });
  }
}
