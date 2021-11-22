import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Server, ServerSchema } from "schemas/server.schema";
import { CaslModule } from "src/casl/casl.module";
import { ChannelsModule } from "src/channels/channels.module";
import { InvitesModule } from "src/invites/invites.module";
import { ServersController } from "./servers.controller";
import { ServersService } from "./servers.service";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Server.name, schema: ServerSchema }]),
    ChannelsModule,
    CaslModule,
    InvitesModule,
  ],
  controllers: [ServersController],
  providers: [ServersService],
  exports: [ServersService],
})
export class ServersModule {}
