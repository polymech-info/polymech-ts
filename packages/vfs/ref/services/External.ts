import { BaseService, Config } from '../services/Base';
import { ChildProcess } from 'child_process';
import * as _ from 'lodash';
const os = require('os');
const path = require('path');
const fs = require('fs');
const NOIMPL = function (fn: string) {
	throw new Error(fn + " not implemented in sub class ");
};

// @TODO: vfs-ext#exists
function exists(_path: string): any {
	try {
		const stat = fs.statSync(_path);
		if (stat.isFile() === true) {
			return true;
		}
	} catch (e) {
	}
	return null;
}
// @TODO:@-> TS aspect signal extension?
export enum EStatus {
	INACTIVE,
	STARTED,
	STARTING,
	RUNNING,
	ERROR,
	INVALID
}
export enum EFlags {
	// No particual behaviour
	None = 0,
	// This service is needed to run the application, otherwise allow failed
	REQUIRED,
	// This service can be retrieved existing instance
	SHARED,
	// This service can be retrieved from a system daemon
	SYSTEM_SHARED = EFlags.SHARED & 1
}
// @TODO: TS garbage
export interface IExternalServiceDesriptor {
	label: string;
	status: EStatus;
}
// ─── Minimum implementation for an external service
export interface IExternalService {
	label(): string;			// 	debugging
	filename(): string;			// 	binary name, ie: 'mongod'. Need for search.
	path(): string;				// 	full path to binary
	init(): Promise<any>;		// 	std call
	start(): Promise<any>;		// 	std call
	stop(): Promise<any>;		// 	std call
	pause?(): Promise<any>;		// 	optional std call
	resume?(): Promise<any>;	// 	optional std call
	validate(): Promise<any>;	// 	std call
	dependencies(): string[];	// 	optional std call
	status: EStatus;
}
// ─── Base class to express an external service binary
export class ExternalService extends BaseService implements IExternalService {
	config: Config;
	process: ChildProcess = null;
	flags: EFlags = EFlags.None;
	status: EStatus = EStatus.INVALID;
	searchPaths: Array<string> = [];
	// @TODO:decorator on Ctor ?
	constructor(config: Config) {
		super(config, null, null);
		if (_.isString(config)) {
			this.configPath = config;
		} else if (_.isObject(config)) {
			this.config = config;
		}
	}
	//
	// ─── DESCRIPTORS ────────────────────────────────────────────────────────────────
	//
	/**
	 * Return an unique label for this service.
	 * - This is being used to help finding the binary.
	 * @returns {string}
	 *
	 * @memberOf ExternalService
	 */
	label(): string {
		return "No Name";
	}
	/**
	 * Return the filename of the binary.
	 * - This is being used to help finding the binary.
	 */
	filename(): string {
		return "No File Name";
	}
	/**
	 * Return the fully resolved path to the application's binary
	 *
	 * @returns {string}
	 *
	 * @memberOf ExternalService
	 */
	path(): string {
		return this.find(this.filename());
	}
	/**
	 * Return a list of depending services, using unique service['label']
	 *
	 * @returns {string[]}
	 *
	 * @memberOf ExternalService
	 */
	dependencies(): string[] {
		return [];
	}
	//
	// ─── API ────────────────────────────────────────────────────────────────
	//
	// TODO: macros?
	async start(): Promise<any> {
		NOIMPL('start');
	}
	async stop(): Promise<any> {
		NOIMPL('stop');
	}
	async pause(): Promise<any> {
		NOIMPL('pause');
	}
	async resume(): Promise<any> {
		NOIMPL('resume');
	}
	async validate(): Promise<any> {
		return Promise.resolve(true);
	}
	async init(): Promise<any> {
		Promise.resolve(true);
	}
	async run(): Promise<void> {
		if (await this.init()) {
			if (await this.validate()) {
				await this.start();
			}
		}
	}
	info(): IExternalServiceDesriptor {
		return {
			label: this.label(),
			status: this.status
		} as IExternalServiceDesriptor;
	}
	//
	// ─── UTILS ──────────────────────────────────────────────────────────────────────
	//
	private _find(filename: string): string {
		// 1. try search paths
		let result: string = null;
		for (let index = 0; index < this.searchPaths.length; index++) {
			let test = this.searchPaths[index];

			// try path as is
			if (exists(test)) {
				result = test;
				break;
			}

			// try with file Name
			if (exists(path.join(test, filename))) {
				result = path.join(test, filename);
				break;
			}
		}
		return result;
	}
	private _findInWindows(filename: string): string {
		return this._find(filename);
	}
	private _findInLinux(filename: string): string {
		let result: string = this._find(filename);
		const which = require('which');
		if (!result && which) {
			try {
				const whichResult: string = which.sync(filename);
				if (whichResult) {
					result = whichResult;
				}
			} catch (e) {

			}
		}

		return result;
	}
	find(filename: string = this.filename()): string {
		switch (os.platform()) {
			case 'win32': {
				return this._findInWindows(filename);
			}
			case 'darwin':
			case 'linux': {
				return this._findInLinux(filename);
			}
		}
	}
}
