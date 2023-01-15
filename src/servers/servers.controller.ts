import { Body, Controller, Delete, forwardRef, Get, HttpException, HttpStatus, Inject, Param, Patch, Post, Put, Request, Res, UseGuards } from "@nestjs/common";
import { Model } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
import { ServerDto } from "dto/server.dto";
import { Server, ServerDocument } from "schemas/server.schema";
import { ServersService } from "./servers.service";
import { AuthGuard } from "@nestjs/passport";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { Action, CaslAbilityFactory } from "src/casl/casl-ability.factory";
import { Response } from "express";
import { User } from "schemas/user.schema";
import { ChannelDto } from "dto/channel.dto";
import { ChannelsService } from "src/channels/channels.service";
import { InvitesService } from "src/invites/invites.service";
import { EmojiDto } from "dto/emoji.dto";
import { EmojisService } from "src/emojis/emojis.service";
import { MembershipsService } from "src/memberships/memberships.service";
import { RedisService } from "src/redis/redis.service";

@Controller("servers")
export class ServersController {
  constructor(
    private readonly serversService: ServersService,
    @Inject(forwardRef(() => ChannelsService))
    private readonly channelsService: ChannelsService,
    private readonly caslAbilityFactory: CaslAbilityFactory,
    @Inject(forwardRef(() => InvitesService))
    private readonly invitesService: InvitesService,
    private readonly emojisService: EmojisService,
    private readonly membershipsService: MembershipsService,
    private readonly redisService: RedisService
  ) { }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() createServerDto: ServerDto, @Request() req) {
    let server = await this.serversService.createServer(createServerDto, req.user._id);
    await this.invitesService.create(server._id, server._id.toString());
    await this.membershipsService.joinServer(req.user._id, server._id);
    await this.channelsService.createChannel({
      name: "general",
    }, server._id);
    server = await this.serversService.get(server._id);
    this.redisService.publish(`${req.user._id}`, "SUBSCRIBE_SERVER", server);
    this.redisService.publish(`user.${req.user._id}`, "SERVER_CREATE", server);
    return server;
  }

  @UseGuards(JwtAuthGuard)
  @Patch(":id")
  async update(@Body() updateServerDto: ServerDto, @Param("id") id: string, @Request() req) {
    const server = await this.serversService.get(id);
    if (server === null) {
      throw new HttpException("Not found", HttpStatus.NOT_FOUND);
    }

    const user: User = req.user;
    const ability = this.caslAbilityFactory.createForUser(user);
    if (server === null) {
      throw new HttpException("Not found", HttpStatus.NOT_FOUND);
    }

    if (ability.can(Action.Delete, server)) {
      const serverUpdated = await this.serversService.update(server._id, updateServerDto);
      this.redisService.publish(`server.${server._id}`, "SERVER_UPDATE", serverUpdated);
      return serverUpdated;
    } else {
      throw new HttpException("Forbidden", HttpStatus.FORBIDDEN);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get(":id")
  async get(@Param("id") id: string) {
    const server: Server = await this.serversService.get(id);
    if (server === null) {
      throw new HttpException("Not found", HttpStatus.NOT_FOUND);
    }
    return {
      data: {
        id: server._id,
        type: "server",
        attributes: server,
      },
    };
  }

  @UseGuards(JwtAuthGuard)
  @Delete(":id")
  async delete(@Param("id") id: string, @Request() req) {
    const server: Server = await this.serversService.get(id);
    if (server === null) {
      throw new HttpException("Not found", HttpStatus.NOT_FOUND);
    }
    const user: User = req.user;
    const ability = this.caslAbilityFactory.createForUser(user);

    if (ability.can(Action.Delete, server)) {
      return this.serversService.deleteServer(server._id);
    } else {
      throw new HttpException("Forbidden", HttpStatus.FORBIDDEN);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Patch(":id")
  async patch(@Body() pactchServerDto: ServerDto, @Param("id") id: string, @Request() req) {
    const server: Server = await this.serversService.get(id);
    if (server === null) {
      throw new HttpException("Not found", HttpStatus.NOT_FOUND);
    }
    const user: User = req.user;
    const ability = this.caslAbilityFactory.createForUser(user);

    if (ability.can(Action.Manage, server)) {
      return this.serversService.update(server._id, pactchServerDto);
    } else {
      throw new HttpException("Forbidden", HttpStatus.FORBIDDEN);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post(":id/channels")
  async createChannel(@Param("id") id: string, @Body() createChannelDto: ChannelDto, @Request() req) {
    const server: Server = await this.serversService.get(id);
    if (server === null) {
      throw new HttpException("Not found", HttpStatus.NOT_FOUND);
    }
    const user: User = req.user;
    const ability = this.caslAbilityFactory.createForUser(user);

    if (ability.can(Action.Update, server)) {
      return this.channelsService.createChannel(createChannelDto, server._id);
    } else {
      throw new HttpException("Forbidden", HttpStatus.FORBIDDEN);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post(":id/emojis")
  async createEmoji(@Param("id") id: string, @Body() createEmojiDto: EmojiDto, @Request() req) {
    const server: Server = await this.serversService.get(id);
    if (server === null) {
      throw new HttpException("Not found", HttpStatus.NOT_FOUND);
    }
    const user: User = req.user;
    const ability = this.caslAbilityFactory.createForUser(user);

    if (ability.can(Action.Update, server)) {
      return this.emojisService.create(createEmojiDto.name, server._id, createEmojiDto.file);
    } else {
      throw new HttpException("Forbidden", HttpStatus.FORBIDDEN);
    }
  }
}
