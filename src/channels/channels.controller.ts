import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Post, Put, Request, UseGuards, Query, UseInterceptors, UploadedFiles } from "@nestjs/common";
import { CreateMessageDto } from "dto/message.dto";
import { Channel } from "schemas/channel.schema";
import { User } from "schemas/user.schema";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { Action, CaslAbilityFactory } from "src/casl/casl-ability.factory";
import { MessagesService } from "src/messages/messages.service";
import { RedisService } from "src/redis/redis.service";
import { ChannelsService } from "./channels.service";
import { Throttle } from "@nestjs/throttler";
import { FilesInterceptor } from "@nestjs/platform-express";
import * as multerS3 from "multer-s3";
import { S3 } from "aws-sdk";
import { simpleflake } from "simpleflakes";

@Controller("channels")
export class ChannelsController {
  constructor(
    private readonly channelsService: ChannelsService,
    private readonly messagesService: MessagesService,
    private readonly redisService: RedisService,
    private caslAbilityFactory: CaslAbilityFactory
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get(":id")
  async get(@Param("id") id: number) {
    const channel: Channel = await this.channelsService.get(id);
    if (channel === null) {
      throw new HttpException("Not found", HttpStatus.NOT_FOUND);
    }
    return {
      data: {
        id: id,
        type: "channel",
        attributes: channel,
      },
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post(":id/messages")
  @UseInterceptors(
    FilesInterceptor("files", 10, {
      storage: multerS3({
        s3: new S3({
          accessKeyId: process.env.S3_KEY_ID ?? "",
          secretAccessKey: process.env.S3_SECRET_KEY ?? "",
          region: "eu-central-1",
          params: {
            Bucket: "neekhaulas-harmony",
          },
        }),
        bucket: "neekhaulas-harmony",
        acl: "public-read",
        contentType: multerS3.AUTO_CONTENT_TYPE,
        key: function (req: any, file, cb) {
          cb(null, `${req.params.id}/${simpleflake().toString()}/${file.originalname}`);
        },
      }),
    })
  )
  async createMessage(
    @Body() createMessageDto: CreateMessageDto,
    @Param("id") id: string,
    @Request() req,
    @UploadedFiles() files: Array<Express.MulterS3.File>
  ) {
    if (files.length > 0) {
      createMessageDto.attachments = files.map((file) => {
        return {
          fileName: file.originalname,
          url: file.location,
          fileSizeBytes: file.size,
        };
      });
    }
    const message = await this.messagesService.create(createMessageDto, id, req.user._id);
    this.redisService.publish(`channel.${id}`, "MESSAGE_CREATE", message);
    return message;
  }

  // @UseGuards(JwtAuthGuard)
  @Get(":id/messages")
  async getMessages(@Param("id") id: string, @Query('before') before: string, @Query('after') after: string) {
    let messages = [];
    if (before !== undefined) {
      messages = await this.messagesService.getByChannel(id, before);
    } else if (after !== undefined) {
      messages = await this.messagesService.getByChannel(id, null, after);
    } else {
      messages = await this.messagesService.getByChannel(id);
    }
    return messages.reverse();
  }

  @UseGuards(JwtAuthGuard)
  @Delete(":channel/messages/:messageId")
  async deleteMessage(@Param("messageId") messageId: string, @Request() req): Promise<any> {
    const message = await this.messagesService.get(messageId);
    if (message === null) {
      throw new HttpException("Not found", HttpStatus.NOT_FOUND);
    }
    const user: User = req.user;
    const ability = this.caslAbilityFactory.createForUser(user);

    if (ability.can(Action.Delete, message)) {
      this.redisService.getClient().publish(`channel.${message.channel}`, JSON.stringify({ event: "MESSAGE_DELETE", data: { id: message._id, channel: message.channel } }));
      return this.messagesService.delete(message._id);
    } else {
      throw new HttpException("Forbidden", HttpStatus.FORBIDDEN);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Put(":channel/messages/:messageId")
  async updateMessage(@Body() createMessageDto: CreateMessageDto, @Param("messageId") messageId: string, @Request() req) {
    const message = await this.messagesService.get(messageId);
    if (message === null) {
      throw new HttpException("Not found", HttpStatus.NOT_FOUND);
    }
    const user: User = req.user;
    const ability = this.caslAbilityFactory.createForUser(user);

    if (ability.can(Action.Update, message)) {
      const updatedMessage = await this.messagesService.update(messageId, createMessageDto);
      this.redisService.getClient().publish(`channel.${message.channel}`, JSON.stringify({ event: "MESSAGE_UPDATE", data: updatedMessage }));
      return updatedMessage;
    } else {
      throw new HttpException("Forbidden", HttpStatus.FORBIDDEN);
    }
  }
}
