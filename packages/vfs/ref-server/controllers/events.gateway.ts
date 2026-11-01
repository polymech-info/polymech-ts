import {
  WebSocketGateway,
  SubscribeMessage,
  WsResponse,
  WebSocketServer,
  WsException,
  OnGatewayConnection,
  OnGatewayDisconnect
} from '@nestjs/websockets';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/from';
import 'rxjs/add/operator/map';

import { DevicesController } from './devices.controller';
import { COMMANDS } from '../shared';
import { debug } from '../log';
import { ConnectionManager } from '../types';

@WebSocketGateway()
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  public _clients: Array<SocketIO.EngineSocket> = [];

  public connectionManager: ConnectionManager;

  public handleConnection(client: any): any {
    this._clients.push(client);
  }
  public handleDisconnect(client: any): any {
    this._clients.splice(this._clients.indexOf(client), 1);
  }
  public OnGatewayConnection(a) {
  }
  @WebSocketServer() server;
  @SubscribeMessage('events')
  onEvent(client, data): Observable<WsResponse<number>> {
    const event = 'events';
    const response = [1, 2, 3];
    return Observable.from(response).map(res => ({ event, data: res }));
  }


  @SubscribeMessage(COMMANDS.PROTOCOL_METHOD)
  onProtocolMethod(client, data): void {
    debug('COMMANDS.PROTOCOL_METHOD', data);
    const event = 'events';
    const response = [1, 2, 3];
    this.connectionManager.protocolMethod(data).then((res) => {
      client.emit(COMMANDS.PROTOCOL_METHOD, {
        data: data,
        response: res
      });
    });
    // return Observable.from({});
  }

  @SubscribeMessage(COMMANDS.DEVICE_SEND)
  onDeviceSend(client, data): void {
    debug(COMMANDS.DEVICE_SEND, data);
    this.connectionManager.sendToDevice(data).then((res) => {
      /*
      client.emit(COMMANDS.PROTOCOL_METHOD, {
        data: data,
        response: res
      });*/
    });
  }

  public broadcast(eventKey: string, data: any) {
    this._clients.forEach((client) => this.send(client, eventKey, data));
  }

  public send(connection: SocketIO.EngineSocket, eventKey: string, data: any) {
    connection.emit(eventKey, data);
  }
}

