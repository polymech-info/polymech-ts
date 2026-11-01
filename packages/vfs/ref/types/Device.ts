import { EDeviceScope } from '../interfaces/index';
import { CIS } from '../interfaces/CI';
export interface IDeviceNode {
	name: string;
	parentId: string;
	isDir: boolean;
	scope: EDeviceScope | string;
	path: string;
	user?: CIS;
}
/**
 * CI names to define logging outputs per device or view
 *
 * @enum {int} LOGGING_FLAGS
 * @global
 */
export enum DEVICE_PROPERTY {
	CF_DEVICE_DRIVER = <any> 'Driver',
	CF_DEVICE_HOST = <any> 'Host',
	CF_DEVICE_PORT = <any> 'Port',
	CF_DEVICE_PROTOCOL = <any> 'Protocol',
	CF_DEVICE_TITLE = <any> 'Title',
	CF_DEVICE_ID = <any> 'Id',
	CF_DEVICE_ENABLED = <any> 'Enabled',
	CF_DEVICE_OPTIONS = <any> 'Options',
	CF_DEVICE_DRIVER_OPTIONS = <any> 'DriverOptions',
	CF_DEVICE_LOGGING_FLAGS = <any> 'Logging Flags'
}
/**
 * Flags to define logging outputs per device or view
 *
 * @enum {int} LOGGING_FLAGS
 * @global
 */
export enum LOGGING_FLAGS {
	/**
	 * No logging
	 * @constant
	 * @type int
	 */
	NONE = 0x00000000,
	/**
	 * Log in the IDEs global console
	 * @constant
	 * @type int
	 */
	GLOBAL_CONSOLE = 0x00000001,
	/**
	 * Log in the IDEs status bar
	 * @constant
	 * @type int
	 */
	STATUS_BAR = 0x00000002,
	/**
	 * Create notification popup in the IDE
	 * @constant
	 * @type int
	 */
	POPUP = 0x00000004,
	/**
	 * Log to file
	 * @constant
	 * @type int
	 */
	FILE = 0x00000008,
	/**
	 * Log into the IDE's dev tool's console
	 * @constant
	 * @type int
	 */
	DEV_CONSOLE = 0x00000010,
	/**
	 * Log into the device's IDE console
	 * @constant
	 * @type int
	 */
	DEVICE_CONSOLE = 0x00000020
}
