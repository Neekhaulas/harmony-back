import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { ChannelsController } from "./channels/channels.controller";
import { UsersController } from "./users/users.controller";
import { MongooseModule } from "@nestjs/mongoose";
import { ConfigModule } from "@nestjs/config";
import { ServersModule } from "./servers/servers.module";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { CaslModule } from "./casl/casl.module";
import { ChatGateway } from "./gateway/chat.gateway";
import snowflakeId from "../plugins/snowflake";
import { JwtModule } from "@nestjs/jwt";
import { ChannelsModule } from "./channels/channels.module";
import { MessagesModule } from "./messages/messages.module";
import { RedisModule } from "./redis/redis.module";
import { InvitesModule } from "./invites/invites.module";
import { InvitesController } from "./invites/invites.controller";
import { MembershipsModule } from "./memberships/memberships.module";
import { EmojisModule } from "./emojis/emojis.module";
import { ThrottlerGuard } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRoot(process.env.MONGODB_HOST, {
      connectionFactory: (connection: any) => {
        connection.plugin(snowflakeId, {
          field: "_id",
          type: false,
        });
        return connection;
      },
    }),
    JwtModule.register({
      secret: "12345",
    }),
    ServersModule,
    AuthModule,
    UsersModule,
    CaslModule,
    ChannelsModule,
    MessagesModule,
    RedisModule,
    InvitesModule,
    MembershipsModule,
    EmojisModule,
  ],
  controllers: [
    AppController,
    ChannelsController,
    UsersController,
    InvitesController,
  ],
  providers: [
    AppService,
    ChatGateway,
    /* {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    }, */
  ],
})
export class AppModule { }
