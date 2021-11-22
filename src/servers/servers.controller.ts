import { Body, Controller, Delete, forwardRef, Get, HttpException, HttpStatus, Inject, Param, ParseIntPipe, Post, Request, Res, UseGuards } from "@nestjs/common";
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

@Controller("servers")
export class ServersController {
  constructor(
    private readonly serversService: ServersService,
    private readonly channelsService: ChannelsService,
    private readonly caslAbilityFactory: CaslAbilityFactory,
    @Inject(forwardRef(() => InvitesService))
    private readonly invitesService: InvitesService
  ) { }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() createServerDto: ServerDto, @Request() req) {
    const server = await this.serversService.createServer(createServerDto, req.user._id);
    this.invitesService.create(server._id, server._id.toString());
    return server;
  }

  @UseGuards(JwtAuthGuard)
  @Get(":id")
  async get(@Param("id", ParseIntPipe) id: number) {
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
  async delete(@Param("id") id: number, @Request() req) {
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
  @Post(":id/channels")
  async createChannel(@Param("id", ParseIntPipe) id: number, @Body() createChannelDto: ChannelDto, @Request() req) {
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
}
