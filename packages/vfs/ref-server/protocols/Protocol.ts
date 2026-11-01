import * as utils from '../shared/utils';
import { DeviceInfo, Connection, DRIVER_FLAGS, DEVICE_FLAGS, IDeviceCommand } from '../types';
import { ConnectionManager } from '../manager/ConnectionManager';
import { Model } from '../shared/model/Model';
import { Device } from '../entities/device.entity';
import * as debug from '../log';

export type ProtocolMethod = any;

export interface IProtocol {
    init: () => ProtocolMethod;
    send: (data: IDeviceCommand) => ProtocolMethod;
    destroy: () => ProtocolMethod;
    connect: () => ProtocolMethod;
    onConnect: (evt?: any) => ProtocolMethod;
    onDisconnect: (evt?: any) => ProtocolMethod;
    onError: (evt?: any) => ProtocolMethod;
    // introspection
    name: () => string;
    handler: () => ConnectionManager;
}

export class Protocol extends Model implements IProtocol {
    _name: string = 'none';
    device: Device;
    connection: Connection;
    _handler: ConnectionManager;
    connected: boolean = false;
    constructor(info: Device, handler: ConnectionManager) {
        super();
        this.device = info;
        this._handler = handler;
    }
    delegate = () => { return this._handler };
    name = () => { return this._name };
    handler = () => { return this._handler };
    init() { }
    send(data: IDeviceCommand): Promise<any> { return Promise.resolve(); }
    connect() { }
    onDisconnect(evt?: any) { }
    onConnect(evt?: any) { }
    onError(evt?: any) { }
    // utils
    toString(cmd: string, encoding) {
        const intArray = utils.bufferFromDecString(cmd);
        const buffer = new Buffer(intArray);
        const str = buffer.toString(encoding);
        return str;
    }
    public isDebug() { return this._hasFlag(DEVICE_FLAGS.DEBUG); }
    public isServer = () => this._hasFlag(DEVICE_FLAGS.SERVER);
    public runAsServer = () => this._hasFlag(DEVICE_FLAGS.RUNS_ON_SERVER);


    private _hasFlag(flag: number) {
        const connection = this.connection;
        if (connection) {
            const device = connection.device;
            if (device) {
                const driverFlags = device.flags;
                if (driverFlags) {
                    if (driverFlags & flag) {
                        return true;
                    }
                } else {
                    debug.error('has flag : have no flags');
                }
            } else {
                debug.error('has flag : have no device');
            }
        } else {
            debug.error('has flag : have no connection');
        }
    }

    public destroy() {
        return super.destroy();
    }
}
