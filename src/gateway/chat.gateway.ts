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
import { MembershipsService } from "src/memberships/memberships.service";
import { MessagesService } from "src/messages/messages.service";
import { RedisService } from "src/redis/redis.service";
import { ServersService } from "src/servers/servers.service";
import { UsersService } from "src/users/users.service";
import { Server, WebSocket } from "ws";

class SocketClient extends WebSocket {
  userId: number;
  subscriber: RedisClient;
  currentChannelSubscribed: number | null;
  currentServerSubscribed: number | null;
}

@WebSocketGateway(3000)
export class ChatGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  constructor(
    private redis: RedisService,
    private jwtService: JwtService,
    private serversService: ServersService,
    private usersService: UsersService,
    private messagesService: MessagesService,
    private membershipsService: MembershipsService
  ) { }

  redisClient: RedisClient;

  handleDisconnect(client: SocketClient) {
    client.subscriber.end();
  }

  afterInit(server: any) {
    console.log("Login to redis");
    this.redisClient = this.redis.getClient();
  }

  handleConnection(client: SocketClient, ...args: any[]) {
    const token = (new URLSearchParams(args[0].url?.split("/?")[1])).get("access_token");
    const decoded = this.jwtService.decode(token);
    client.userId = decoded["id"];
    client.subscriber = this.redis.createClient();
    client.subscriber.on("message", (channel, message) => {
      const { event, data } = JSON.parse(message);
      client.send(JSON.stringify({ event, data }));
    });
  }

  @WebSocketServer()
  server: Server;

  @SubscribeMessage("me")
  async handleMe(client: SocketClient, payload: any) {
    const user: User = await this.usersService.get(client.userId);
    const servers = await this.membershipsService.getUserMemberships(client.userId);
    return {
      event: "me",
      data: {
        user,
        servers,
      },
    };
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
    const messages = await this.messagesService.getByChannel(data);
    return {
      event: "messages",
      data: messages,
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
}
