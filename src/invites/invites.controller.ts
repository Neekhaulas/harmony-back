import { Controller, Get, HttpException, HttpStatus, Param, Post, Request, UseGuards } from "@nestjs/common";
import { Invite } from "schemas/invite.schema";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { ServersService } from "src/servers/servers.service";
import { InvitesService } from "./invites.service";
import { MembershipsService } from "src/memberships/memberships.service";

@Controller("invites")
export class InvitesController {
  constructor(
    private readonly invitesService: InvitesService,
    private readonly serversService: ServersService,
    private readonly membershipsService: MembershipsService
  ) { }

  @Get(":code")
  async get(@Param("code") code: string) {
    const invite = await this.invitesService.get(code);
    if (invite === null) {
      throw new HttpException("Not found", HttpStatus.NOT_FOUND);
    }
    return {
      data: {
        id: invite._id,
        type: "invite",
        attributes: invite,
      },
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post(":code")
  async join(@Param("code") code: string, @Request() req) {
    const invite: Invite = await this.invitesService.get(code);
    if (invite === null) {
      throw new HttpException("Not found", HttpStatus.NOT_FOUND);
    }
    await this.membershipsService.joinServer(req.user._id, invite.server);
    return {
      invite,
    };
  }
}
