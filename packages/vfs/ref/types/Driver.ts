export enum DRIVER_PROPERTY {
	CF_DRIVER_NAME = <any> 'CF_DRIVER_NAME',
	CF_DRIVER_ICON = <any> 'CF_DRIVER_ICON',
	CF_DRIVER_CLASS = <any> 'CF_DRIVER_CLASS',
	CF_DRIVER_ID = <any> 'CF_DRIVER_ID',
	CF_DRIVER_COMMANDS = <any> 'CF_DRIVER_COMMANDS',
	CF_DRIVER_VARIABLES = <any> 'CF_DRIVER_VARIABLES',
	CF_DRIVER_RESPONSES = <any> 'CF_DRIVER_RESPONSES'
}
/**
 * Bitmask or flags for device about its driver setup
 * @enum {int} DRIVER_FLAGS
 * @global
 */
export enum DRIVER_FLAGS {
	/**
	 * Mark the driver for "server side"
	 */
	RUNS_ON_SERVER = 2,
	/**
	 * Enable protocol's debug message on console
	 */
	DEBUG = 4,
	/**
	 * Run as server: implemented for UDP & TCP. Null-Modem driver under linux for Serial.
	 */
	SERVER = 16
}
