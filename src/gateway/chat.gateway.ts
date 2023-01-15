import { Module } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayInit,
  OnGatewayDisconnect,
} from "@nestjs/websockets";
import { RedisClient } from "redis";
import { User } from "schemas/user.schema";
import { ChannelsService } from "src/channels/channels.service";
import { MembershipsService } from "src/memberships/memberships.service";
import { MessagesService } from "src/messages/messages.service";
import { RedisService } from "src/redis/redis.service";
import { ServersService } from "src/servers/servers.service";
import { UsersService } from "src/users/users.service";
import { Server, WebSocket } from "ws";

class SocketClient extends WebSocket {
  waitingForAuthentication: boolean;
  userId: string;
  subscriber: RedisClient;
  currentChannelSubscribed: number | null;
  currentServerSubscribed: number | null;
}

@WebSocketGateway(9000)
export class ChatGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  constructor(
    private redis: RedisService,
    private jwtService: JwtService,
    private serversService: ServersService,
    private channelsService: ChannelsService,
    private usersService: UsersService,
    private messagesService: MessagesService,
    private membershipsService: MembershipsService
  ) { }

  redisClient: RedisClient;

  handleDisconnect(client: SocketClient) {
    client.subscriber.end();
  }

  afterInit(server: any) {
    this.redisClient = this.redis.getClient();
  }

  async handleConnection(client: SocketClient, ...args: any[]) {
    client.waitingForAuthentication = true;
  }

  async registerEventHandlers(client: SocketClient) {
    client.subscriber = this.redis.createClient();
    client.subscriber.on("message", (channel, message) => {
      const { event, data } = JSON.parse(message);
      switch (event) {
        case "SERVER_CREATE":
          client.subscriber.subscribe(`server.${data._id}`);
          data.channels.forEach((channel) => {
            client.subscriber.subscribe(`channel.${channel._id}`);
          });
          break;

        case "CHANNEL_CREATE":
          client.subscriber.subscribe(`channel.${data._id}`);
          break;
      }
      client.send(JSON.stringify({ event, data }));
    });
    client.subscriber.subscribe(`user.${client.userId}`);
    client.subscriber.subscribe(`${client.userId}`);

    //Subscribe to all server/channels

    const servers = await this.membershipsService.getUserMemberships(client.userId);
    servers.forEach((server) => {
      client.subscriber.subscribe(`server.${server._id}`);
      server.channels.forEach((channel) => {
        client.subscriber.subscribe(`channel.${channel._id}`);
      });
    });
  }

  @WebSocketServer()
  server: Server;

  @SubscribeMessage("AUTHENTICATE")
  async authenticate(client: SocketClient, payload: any) {
    if (client.waitingForAuthentication) {
      try {
        const decoded = this.jwtService.decode(payload);
        client.userId = decoded["id"];
        client.waitingForAuthentication = false;

        const user: User = await this.usersService.get(client.userId);
        const servers = await this.membershipsService.getUserMemberships(client.userId);
        return {
          event: "READY",
          data: {
            user,
            servers,
          },
        };
      } catch (error) {
        client.close();
      }
    }
    //this.registerEventHandlers(client);
  }

  @SubscribeMessage("ping")
  handlePing(client: any, data: any) {
    return {
      event: "pong",
    };
  }

  @SubscribeMessage("channel")
  async handleChannel(client: SocketClient, data: any) {
    data = parseInt(data);
    if (client.currentChannelSubscribed !== null) {
      client.subscriber.unsubscribe(`channel.${data}`);
    }
    client.subscriber.subscribe(`channel.${data}`);
    const channel = await this.channelsService.get(data);
    const messages = await this.messagesService.getByChannel(data);
    return {
      event: "channel",
      data: {
        channelId: data,
        messages,
      },
    };
  }

  @SubscribeMessage("server")
  async handleServer(client: SocketClient, data: any) {
    data = parseInt(data);
    if (client.currentServerSubscribed !== null) {
      client.subscriber.unsubscribe(`server.${data}`);
    }
    client.subscriber.subscribe(`server.${data}`);
  }

  @SubscribeMessage("presence")
  async handlePresence(client: SocketClient, data: any) {
    client.subscriber.subscribe(`presence.${data}`);
    const users = await this.membershipsService.getServerUsers(data);
    return {
      event: "PRESENCE",
      data: {
        server: data,
        presences: users,
      },
    };
  }
}
