import * as WebSocket from "ws";
import { WebSocketAdapter, INestApplicationContext } from "@nestjs/common";
import { MessageMappingProperties } from "@nestjs/websockets";
import { Observable, fromEvent, EMPTY } from "rxjs";
import { mergeMap, filter } from "rxjs/operators";
import { JwtService } from "@nestjs/jwt";

export class WsAdapter implements WebSocketAdapter {
  private jwtService: JwtService;

  constructor(private app: INestApplicationContext) {
    this.jwtService = this.app.get(JwtService);
  }

  create(port: number, options: any = {}): any {
    return new WebSocket.Server({
      port,
      ...options,
      verifyClient: (info, done) => {
        const token = (new URLSearchParams(info.req.url?.split('/?')[1])).get('access_token');
        const decoded = this.jwtService.decode(token);
        if (decoded === null) {
          return done(false, 403, "Forbidden");
        }
        return done(true);
      },
    });
  }

  bindClientConnect(server, callback: any) {
    server.on("connection", callback);
  }

  bindMessageHandlers(
    client: WebSocket,
    handlers: MessageMappingProperties[],
    process: (data: any) => Observable<any>
  ) {
    fromEvent(client, "message")
      .pipe(
        mergeMap(data => this.bindMessageHandler(data, handlers, process)),
        filter(result => result),
      )
      .subscribe(response => client.send(JSON.stringify(response)));
  }

  bindMessageHandler(
    buffer,
    handlers: MessageMappingProperties[],
    process: (data: any) => Observable<any>
  ): Observable<any> {
    const message = JSON.parse(buffer.data);
    const messageHandler = handlers.find(
      handler => handler.message === message.event,
    );
    if (!messageHandler) {
      return EMPTY;
    }
    return process(messageHandler.callback(message.data));
  }

  close(server) {
    server.close();
  }
}