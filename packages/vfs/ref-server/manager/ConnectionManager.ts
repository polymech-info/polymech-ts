import { DeviceInfo, Connection, Protocol, Tcp, EVENTS, DEVICE_STATE, ERROR_CODES, ERRORS, RETRY_SETTINGS, RETRY_MODE } from '../types';
import * as debug from '../log';
import { Device } from '../entities/device.entity';
import { User } from '../entities/user.entity';
import * as lodash from 'lodash';
import { Context } from './Context';
import { EventEmitter } from 'events';
import { parse } from 'error-stack-parser';
import { description } from '../types';
import { remove } from '@xblox/core/arrays';
import { DeviceDto } from '../dto/device.dto';


const protocol = (protocol: string) => {
    switch (protocol) {
        case 'Tcp': return Tcp;
    }
}

export interface IProtocolHandler {
    onData: (connection: Protocol, data: Buffer) => void;
    onError: (connection: Protocol, error: Error) => void;
    onTimeout: (connection: Protocol) => void;
    onClose: (connection: Protocol, data?: Buffer) => void;
}
export class ConnectionManager extends EventEmitter {
    connected: boolean = false;
    _info: DeviceInfo;
    id: string;
    connections: Connection[] = [];
    constructor(private readonly context: Context) {
        super();
    }
    info = (): DeviceInfo => { return this._info };

    sendToDevice(data: any): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            const device = data.device as DeviceDto;
            const connection = this.connectionByHost(device.host, device.port, device.protocol);
            if (connection) {
                // debug.log('send to device', data);
                try {
                    connection.instance.send(data).then(resolve, (e) => {
                        debug.error('error sending command', e);
                    });
                } catch (e) {
                    debug.error('error sending command', e);
                }
            } else {
                debug.error('Send to device, no such connection ' + this.connections.length);
                reject('No such device');
            }
        });
    }

    protocolMethod(data: any): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            data = data.data;
            const method = data.method;
            const args = data.args;
            const prot = protocol(data.protocol);
            if (prot) {
                if (prot[method]) {
                    const ret = prot[method].apply(prot, args);
                    if (ret && ret.then) {
                        ret.then((d) => {
                            resolve(d);
                        })
                    } else {
                        debug.error('protocol method ' + method + ' in ' + prot + ' has no result');;
                        reject('protocol method ' + method + ' in ' + prot + ' has no result');
                    }
                } else {
                    debug.error('no such protocol method ' + method + ' in ' + prot);
                    reject('no such protocol method ' + method + ' in ' + prot);
                }
            } else {
                debug.error('no such protocol ' + method, data);
                reject('no such protocol ' + method);
            }
        });
    }
    onData(connection: Protocol, data: Buffer) {
        debug.inspect('on data', data.toString());

        this.emit(EVENTS.ON_DEVICE_MESSAGE, {
            device: connection.device,
            data: data.toString(),
            bytes: data.join(',')
        });
    }
    onConnected(instance: Protocol, data: Buffer) {
        instance.connection.device.state = DEVICE_STATE.CONNECTED;
        instance.connection.connectingResolve(instance.connection.device);
        instance.connection.connectingResolve = null;
        debug.inspect('on connected', data ? data.toString() : {});

        this.emit(EVENTS.ON_DEVICE_CONNECTED, {
            device: instance.connection.device
        });

    }
    onError(instance: Protocol, error: NodeJS.ErrnoException) {
        const device = instance.device;
        const err = {
            code: error.code,
            description: description(error.errno),
            stack: error.stack ? parse(error) : null,
            device: device
        };
        this.emit(EVENTS.ON_DEVICE_ERROR, err);
        // console.log('err', err);
        switch (err.code) {
            case ERRORS.EHOSTUNREACH: {
                const retry = ((device.retry as any) as RETRY_SETTINGS);
                switch (retry.mode) {
                    case RETRY_MODE.ABORT_AFTER_TRIALS: {

                        // did hit the max
                        if (retry.counter > retry.value) {
                            debug.info('retry trials max limit reached ', instance.connection.toString());
                            device.state = DEVICE_STATE.UNREACHABLE;
                            break;
                        }
                        retry.counter++;
                        setTimeout(() => {
                            debug.info('reconnect ', instance.connection.toString());
                            this.connect(instance.connection.user, device);
                        }, retry.interval);
                    }
                }
                // debug.error('unreach', retry);
                break;
            }
        }
        // debug.inspect('Error', err);
    };
    onTimeout(connection: Protocol) { };
    onClose(connection: Protocol, data?: Buffer) {
        console.log('connection closed');
    };

    connect(user: User, device: Device) {
        try {
            const id = Connection.id(user, device);
            let connection: Connection = lodash.find(this.connections, {
                id: id
            });
            if (!connection) {
                // debug.log('no connection yet ');
            }

            if (!connection) {
                const tcp = new Tcp(device, this);
                connection = new Connection();
                connection.id = id;
                connection.user = user;
                connection.instance = tcp;
                connection.device = device;
                connection.instance.connection = connection;
                connection.init();
                connection.connecting = new Promise<Device>((resolve, reject) => {
                    connection.connectingResolve = resolve;
                });
                connection.instance.connect();
                device.state = DEVICE_STATE.CONNECTING;
                this.connections.push(connection);
                return connection.connecting;
            } else {
                return Promise.resolve(device);
            }

        } catch (e) {
            debug.error('error connecting device', e);
        }
    }

    public connectionByHost(host: string, port: string, protocol: string): Connection | undefined {
        let connection: Connection = lodash.find(this.connections, {
            device: {
                host: host,
                port: port,
                protocol: protocol
            }
        }
        );
        return connection;
    }

    public connectionByDevice(host: string, port: string, protocol: string): Connection | undefined {
        let connection: Connection = lodash.find(this.connections, {
            host,
            port,
            protocol
        });
        return connection;
    }

    disconnect(user: User, device: Device) {
        try {
            const id = Connection.id(user, device);
            let connection: Connection = lodash.find(this.connections, {
                id: id
            });
            if (connection) {
                connection.instance.destroy();
                remove(this.connections, connection);
                connection.device.state = DEVICE_STATE.DISCONNECTED;
                this.emit(EVENTS.ON_DEVICE_DISCONNECTED, { device });
            } else {
                console.log('no such connection', device.toString());
            }
            return device;
        } catch (e) {
            debug.error('error disconnecting device ' + device.toString(), e);
        }
    }
}