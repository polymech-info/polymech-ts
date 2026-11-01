import { DeviceDto } from './dto/device.dto';

export * from './shared/model/Model';
export * from './shared/model/Device';
export * from './shared/model/Driver';
export * from './model/Connection';
export * from './extensions/Evented';
export * from './protocols/Protocol';
export * from './protocols/Tcp';
export * from './manager/ConnectionManager';
export * from './shared/enums';
export * from './errors';
export { Device } from './entities/device.entity';

export interface IDeviceCommand {
	command: string;
	device_command: string;
	device: DeviceDto;
	params: any;
}

// tslint:disable-next-line:interface-name
export interface Hash<T> {
	[id: string]: T;
}
// tslint:disable-next-line:interface-name
export interface List<T> {
	[index: number]: T;
	length: number;
}
/**
 * Interface of the simple literal object with any string keys.
 */
export interface IObjectLiteral {
	[key: string]: any;
}
/**
 * Represents some Type of the Object.
 */
export type ObjectType<T> = { new(): T } | Function;
/**
 * Same as Partial<T> but goes deeper and makes Partial<T> all its properties and sub-properties.
 */
export type DeepPartial<T> = {
	[P in keyof T]?: DeepPartial<T[P]>;
};

export interface IDelimitter {
	begin: '%';
	end: '%';
}

export type JSONPathExpression = string;
