import { Injectable, OnModuleInit } from "@nestjs/common";
import { RedisClient } from "redis";

@Injectable({})
export class RedisService implements OnModuleInit {
  private client: RedisClient;

  onModuleInit() {
    this.client = new RedisClient({
      host: process.env.REDIS_HOST,
    });
  }

  getClient(): RedisClient {
    return this.client;
  }

  createClient(): RedisClient {
    return new RedisClient({
      host: process.env.REDIS_HOST,
    });
  }

  publish(channel: string, event: string, data: any) {
    return this.client.publish(channel, JSON.stringify({ event, data }));
  }
}
