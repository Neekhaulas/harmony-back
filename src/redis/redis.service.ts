import { Injectable, OnModuleInit } from "@nestjs/common";
import { RedisClient } from "redis";

@Injectable({})
export class RedisService implements OnModuleInit {
  private client: RedisClient;

  onModuleInit() {
    this.client = new RedisClient({
      host: process.env.REDIS_HOST,
    });
    console.log("Started redis service");
  }

  getClient(): RedisClient {
    return this.client;
  }

  createClient(): RedisClient {
    return new RedisClient({
      host: process.env.REDIS_HOST,
    });
  }
}
