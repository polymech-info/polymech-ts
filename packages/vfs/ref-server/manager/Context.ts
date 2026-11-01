import { Model, ConnectionManager, DeviceInfo, Tcp, EVENTS } from '../types';
import { User } from '../entities/user.entity';
import { Device } from '../entities/device.entity';
import * as  debug from '../log';
import { EventsGateway } from '../controllers/events.gateway';

export interface Options {
    user: User
}

export class Context extends Model {
    user: User;
    _options: Options;
    gateway: EventsGateway;

    public key = (): string => '';
    public options = (): Options => this._options;
    public connectionManager: ConnectionManager;
    constructor(
    ) {
        super();
        this.connectionManager = new ConnectionManager(this);

    }

    public init(user: User, gateway: EventsGateway) {
        this.user = user;
        this.gateway = gateway;
        
        this.gateway.connectionManager = this.connectionManager;
        
        // forward to everybody
        [
            EVENTS.ON_DEVICE_CONNECTED,
            EVENTS.ON_DEVICE_DISCONNECTED,
            EVENTS.ON_DEVICE_CONNECTING,
            EVENTS.ON_DEVICE_ERROR,
            EVENTS.ON_DEVICE_MESSAGE
        ].forEach((key) => {
            this.connectionManager.on(key, (data) => {
                console.log('broadcast device event ' + key);
                this.gateway.broadcast(key, data);
            })
        });
    }
    public run = () => {
        // debug.inspect('run context', this.user);
        const cm = this.connectionManager;
    }

    public start(device: Device) {
        return new Promise<Device>((resolve, reject) => {
            debug.log('start user device ', device.toString());
            this.connectionManager.connect(this.user, device).then((device) => {
                resolve(device);
            });
        });
    }

    public stop(device: Device) {
        return new Promise<Device>((resolve, reject) => {
            debug.log('stop user device ', device.toString());
            this.connectionManager.disconnect(this.user, device);
            resolve(device);
        });
    }
}