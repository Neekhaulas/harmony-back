import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, ParseIntPipe, Post, Put, Request, UseGuards } from "@nestjs/common";
import { CreateMessageDto } from "dto/message.dto";
import { Channel } from "schemas/channel.schema";
import { User } from "schemas/user.schema";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { Action, CaslAbilityFactory } from "src/casl/casl-ability.factory";
import { MessagesService } from "src/messages/messages.service";
import { RedisService } from "src/redis/redis.service";
import { ChannelsService } from "./channels.service";

@Controller("channels")
export class ChannelsController {
  constructor(
    private readonly channelsService: ChannelsService,
    private readonly messagesService: MessagesService,
    private readonly redisService: RedisService,
    private caslAbilityFactory: CaslAbilityFactory
  ) { }

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
  async createMessage(@Body() createMessageDto: CreateMessageDto, @Param("id", ParseIntPipe) id: number, @Request() req) {
    const message = await this.messagesService.create(createMessageDto, id, req.user._id);
    this.redisService.publish(`channel.${id}`, "MESSAGE_CREATE", message);
    return message;
  }

  @UseGuards(JwtAuthGuard)
  @Get(":id/messages")
  async getMessages(@Param("id", ParseIntPipe) id: number) {
    const messages = await this.messagesService.getByChannel(id);
    return messages;
  }

  @UseGuards(JwtAuthGuard)
  @Delete(":channel/messages/:messageId")
  async deleteMessage(@Param("messageId", ParseIntPipe) messageId: number, @Request() req) {
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
  async updateMessage(@Body() createMessageDto: CreateMessageDto, @Param("messageId", ParseIntPipe) messageId: number, @Request() req) {
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
