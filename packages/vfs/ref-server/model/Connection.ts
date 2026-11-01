import { DeviceInfo } from '../shared/types';
import { Protocol } from '../protocols/Protocol'
import { v4 } from 'uuid';
import { Device } from '../entities/device.entity';
import { User } from '../entities/user.entity';
import { DriverInstance } from '../shared/driver/DriverInstance';
import * as md5 from 'md5';

export class Connection {
    connected: boolean = false;
    id: string;
    public instance: Protocol;
    public device: Device;
    public user: User;
    public connecting: Promise<any> = null;
    public connectingResolve: any;
    public disconnecting: Promise<any> = null;
    public driver: DriverInstance = null;
    public init() {
        this.driver = new DriverInstance(this.device, null);
    }
    static id(user: User, device: Device) {
        const data = {
            host: device.host,
            port: device.port,
            protocol: device.protocol
        }
        return md5(JSON.stringify(data));
    }
    public toString() {
        return `${this.device.protocol}://${this.device.host}:${this.device.port}`
    }

}