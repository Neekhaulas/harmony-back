import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Emoji, EmojiDocument } from "schemas/emoji.schema";
import { S3 } from "aws-sdk";

@Injectable()
export class EmojisService {
  s3: S3;
  constructor(
    @InjectModel(Emoji.name)
    private readonly emojiModel: Model<EmojiDocument>
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

  async create(name: string, server: string, emojiData: string) {
    const emoji = await this.emojiModel.create({
      name,
      server,
    });

    const buf = Buffer.from(emojiData.replace(/^data:image\/\w+;base64,/, ""), "base64");
    const data = {
      Key: emoji._id + ".png",
      Body: buf,
      ContentEncoding: "base64",
      ContentType: "image/png",
      Bucket: "neekhaulas-harmony",
      ACL: "public-read",
    };
    this.s3.putObject(data, function (err: any, data: any) {
      if (err) {
        console.log(err);
        console.log("Error uploading data: ", data);
      } else {
        console.log("successfully uploaded the image!");
      }
    });
  }
}
