// tslint:disable-next-line:interface-name
export interface Hash<T> {
	[ id: string ]: T;
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
export type ObjectType<T> = { new (): T } | Function;
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

export enum EPlatform {
	Linux = <any> 'linux',
	Windows = <any> 'win32',
	OSX = <any> 'darwin'
}
export enum EArch {
	x64 = <any> '64',
	x32 = <any> '32'
}

export enum EDeviceScope {
	USER_DEVICES = <any> 'user_devices',
	SYSTEM_DEVICES = <any> 'system_devices'
}
export enum EDriverScope {
	USER_DRIVERS = <any> 'user_drivers',
	SYSTEM_DRIVERS = <any> 'system_drivers'
}
