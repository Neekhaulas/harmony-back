import { forwardRef, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Server, ServerSchema } from "schemas/server.schema";
import { CaslModule } from "src/casl/casl.module";
import { ChannelsModule } from "src/channels/channels.module";
import { EmojisModule } from "src/emojis/emojis.module";
import { InvitesModule } from "src/invites/invites.module";
import { ServersController } from "./servers.controller";
import { ServersService } from "./servers.service";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Server.name, schema: ServerSchema }]),
    forwardRef(() => ChannelsModule),
    CaslModule,
    InvitesModule,
    EmojisModule,
  ],
  controllers: [ServersController],
  providers: [ServersService],
  exports: [ServersService],
})
export class ServersModule {}
