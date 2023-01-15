import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Server, ServerDocument } from "schemas/server.schema";
import { ServerDto } from "dto/server.dto";
import { S3 } from "aws-sdk";
import { UniqueID } from "nodejs-snowflake";

@Injectable()
export class ServersService {
  s3: S3;

  constructor(
    @InjectModel(Server.name)
    private readonly serverModel: Model<ServerDocument>
  ) {
    // replace by a service
    this.s3 = new S3({
      accessKeyId: process.env.S3_KEY_ID ?? "",
      secretAccessKey: process.env.S3_SECRET_KEY ?? "",
      region: "eu-central-1",
      params: {
        Bucket: "neekhaulas-harmony",
      },
    });
  }

  async createServer(createServerDto: ServerDto, owner: string): Promise<Server> {
    const createdServer = await this.serverModel.create({
      ...createServerDto,
      owner: owner,
    });
    return createdServer;
  }

  async get(serverId: string): Promise<Server | null> {
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

  async deleteServer(id: string): Promise<any> {
    return await this.serverModel.deleteOne({ id });
  }

  async update(id: string, data: ServerDto): Promise<any> {
    if (data.image !== undefined && data.image.startsWith("data:")) {
      const buf = Buffer.from(data.image.replace(/^data:image\/\w+;base64,/, ""), "base64");
      const id = new UniqueID().getUniqueID().toString();
      const bucket = {
        Key: `${id}.png`,
        Body: buf,
        ContentEncoding: "base64",
        ContentType: "image/png",
        Bucket: "neekhaulas-harmony",
        ACL: "public-read",
      };
      await this.s3.putObject(bucket).promise();
      data.image = id;
    }
    return await this.serverModel.findOneAndUpdate({ _id: id }, { $set: data }, { new: true });
  }
}
