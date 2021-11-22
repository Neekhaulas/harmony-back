import { forwardRef, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Invite, InviteSchema } from "schemas/invite.schema";
import { MembershipsModule } from "src/memberships/memberships.module";
import { ServersModule } from "src/servers/servers.module";
import { InvitesController } from "./invites.controller";
import { InvitesService } from "./invites.service";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Invite.name, schema: InviteSchema }]),
    forwardRef(() => ServersModule),
    MembershipsModule,
  ],
  controllers: [InvitesController],
  providers: [InvitesService],
  exports: [InvitesService],
})
export class InvitesModule {}
