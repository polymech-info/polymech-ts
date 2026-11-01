import { EFlags, EStatus, ExternalService, IExternalService, IExternalServiceDesriptor } from '../External';
import * as mkdirp from 'mkdirp';
import { console } from '../../console';
const os = require('os');
const arch = os.arch();
const path = require('path');
const fs = require('fs');
const jet = require('fs-jetpack');
const childprocess = require('child_process');
let Registry = require('winreg');
function isOSWin64() {
	return process.arch === 'x64' || process.env.hasOwnProperty('PROCESSOR_ARCHITEW6432');
}

function exists(_path: string): any {
	try {
		return fs.statSync(_path);
	} catch (e) {
	}
	return null;
}
/**
 * Configuration options for {@link Mongod}.
 * @typedef {Object} IMongoConfig
 * @property {String} [path=mongod]
 * @property {String} [config]
 * @property {(Number|String)} [port=27017]
 * @property {String} [db]
 * @property {String} [engine]
 * @property {Boolean} [nojournal=false]
 */
export interface IMongoConfig {
	path?: string;
	config?: string;
	port?: number | string;
	db?: string;
	engine?: string;
	nojournal?: boolean;
	smallfiles?: boolean;
	quite?: boolean;
}
export enum EError {
	WAITING = 1,
	ALREADY_IN_USE,
	DENIED,
	ERROR
}
/**
 * {@link Mongod.parseData} to
 * parse stdout and stderr messages.
 * @see Mongod.parseData
 * @readonly
 * @private
 * @type {Object.<String,RegExp>}
 */
const MessageRegEx = {
	terminalMessage: /waiting\s+for\s+connections|already\s+in\s+use|denied|error|exception|badvalue/im,
	whiteSpace: /\s/g,
	newline: /\r?\n/
};
export class Mongod extends ExternalService implements IExternalService {
	mongoConfig: IMongoConfig;
	promiseQueue: any = null;
	openPromise: any = null;
	debug: boolean = false;
	closePromise: Promise<any>;
	private isRunning: boolean = false;
	private isClosing: boolean = false;
	private isOpening: boolean = false;
	flags: EFlags = EFlags.REQUIRED | EFlags.SHARED;
	constructor(config: IMongoConfig, searchPaths?: Array<string>, debug: boolean = false) {
		super(null);
		this.mongoConfig = config;
		this.debug = debug;
		this.searchPaths = searchPaths || [];
	}
	//
	// ─── IMPLEMENT EXTERNAL SERVICE ──────────────────────────────────────────────────
	//
	filename(): string {
		return 'mongod' + (os.platform() === 'win32' ? '.exe' : '');
	}
	label(): string {
		return 'MongoDB';
	}
	async stop(): Promise<any> {
		if (this.isClosing) {
			return this.closePromise;
		}

		this.isClosing = true;
		this.isOpening = false;
		this.closePromise = new Promise((resolve) => {
			if (this.isOpening || !this.isRunning) {
				this.isClosing = false;
				return Promise.resolve(null);
			}
			this.process.once('close', () => resolve(null));
			this.process.kill();
		});
		return this.closePromise;
	}

	async start(): Promise<any> {
		const exe = this.find();
		if (!exe) {
			Promise.reject("Cant find mongod binary!");
			return false;
		}
		this.status = EStatus.STARTING;
		if (this.isClosing || this.isRunning) {
			this.isOpening = false;
			return Promise.resolve(null);
		}
		return new Promise((resolve, reject) => {
			/**
			 * A listener for the current server process' stdout/stderr that
			 * resolves or rejects the current {@link Promise} when done.
			 * @see Mongod.getTextLineAggregator
			 * @see Mongod.parseData
			 * @argument {Buffer} buffer
			 * @return {undefined}
			 */
			const dataListener = Mongod.getTextLineAggregator((value) => {
				const result = Mongod.parseData(value);
				if (result === null) {
					return;
				}
				this.process.stdout.removeListener('data', dataListener);
				this.isOpening = false;
				if (result.err === null) {
					this.isRunning = true;
					resolve(null);
				}

				else {
					switch (result.err.code) {
						case EError.ALREADY_IN_USE: {
							if (!(this.flags & EFlags.SHARED)) {
								this.isClosing = true;
							} else {
								this.isRunning = true;
								resolve(null);
							}
							break;
						}
						case EError.DENIED:
						case EError.ERROR: {
							this.isClosing = true;
							reject(result.err.message);
						}
					}
					this.process.once('close', () => reject(result.err.message));
				}
			});

			/**
			 * A listener to close the server when the current process exits.
			 * @return {undefined}
			 */
			const exitListener = () => {
				// istanbul ignore next
				this.stop();
			};

			/**
			 * Get a text line aggregator that emits a given {@linkcode event} for the current server.
			 * @see Mongod.getTextLineAggregator
			 * @argument {String} event
			 * @return {Function}
			 */
			const getDataPropagator = (event) => Mongod.getTextLineAggregator((line) => function (event, data) { });
			console.info('start Mongo ' + this.mongoConfig.path + ' at port ' + this.mongoConfig.port + ' and data at ' + this.mongoConfig.db);
			this.process = childprocess.spawn(
				this.mongoConfig.path,
				Mongod.parseFlags(this.mongoConfig)
			);
			this.process.stderr.on('data', dataListener);
			this.process.stderr.on('data', getDataPropagator('stdout'));
			this.process.stdout.on('data', dataListener);
			this.process.stdout.on('data', getDataPropagator('stdout'));
			this.process.on('close', () => {
				this.process = null;
				this.isRunning = false;
				this.isClosing = false;
				process.removeListener('exit', exitListener);
			});
			process.on('exit', exitListener);
		});
	};
	async canReadAndWrite(targetPath) {
		return new Promise((resolve, reject) => {
			fs.stat(targetPath, (err) => {
				if (err) { reject(err); return; }
				fs.access(targetPath, fs.W_OK | fs.R_OK | fs.R_OK, (err) => {
					if (err) {
						const dir = path.dirname(targetPath);
						fs.access(dir, fs.W_OK | fs.R_OK, (err) => {
							if (err) { reject(err); return; }
							resolve(false);
						});
					}

					resolve(true);
				});
			});
		});

	}
	info(): IExternalServiceDesriptor {
		return {
			label: this.label()
		} as IExternalServiceDesriptor;
	}
	async _tryProgramFiles(): Promise<any> {
		const programFiles = await this._getProgramFilesDirectory();
		const mongoInProgramFiles = programFiles + path.sep + 'MongoDB' + path.sep + 'Server';
		return new Promise((resolve, reject) => {
			if (exists(mongoInProgramFiles)) {
				// we should have mongoInProgramFiles now at C:\Program Files\MongoDB\Server
				// next step is to find the highest version possible :
				let list = fs.readdirSync(mongoInProgramFiles);
				let last = 0;
				list.forEach(function (file) {
					const v = parseFloat(file);
					if (v > last) {
						last = v;
					}
				});
				if (last) {
					const bin = mongoInProgramFiles + path.sep + last + path.sep + 'bin' + path.sep + 'mongod.exe';
					if (exists(bin)) {
						resolve(bin);
					} else {
						reject('Cant find ' + bin);
					}
				} else {
					reject('Cant find ' + mongoInProgramFiles);
				}

			} else {
				reject('false');
			}
		});

	}
	async _getProgramFilesDirectory() {
		const is64 = isOSWin64();
		const key = new Registry({
			hive: Registry.HKLM,
			key: '\\Software\\Microsoft\\Windows\\CurrentVersion\\'
		});
		const loc = is64 ? 'ProgramW6432Dir' : 'ProgramFiles';
		return new Promise((resolve, reject) => {
			key.get(loc, function (err, item) {
				if (err) {
					reject(err);
				}
				if (item) {
					resolve(item.value);
				}
			});
		});
	}

	// override init to adjust default search paths since we're deploying mongod together with the applications
	async init(): Promise<any> {
		switch (os.platform()) {
			case 'win32': {
				try {
					const mongoInProgramFiles = await this._tryProgramFiles();
					if (mongoInProgramFiles) {
						this.searchPaths = this.searchPaths.concat([mongoInProgramFiles]);
					}
				} catch (e) {

				}
				//in export scenario, mongod exists in root/mongo/mongod-[platform].exe
				const found: string[] = [];
				this.searchPaths.forEach(_path => {
					const bin = _path + path.sep + 'mongod-windows.exe';
					if (exists(bin)) {
						found.push(bin);
					}
				});
				this.searchPaths.push(...found);
				break;
			}
			case 'darwin':
			case 'linux': {
				this.searchPaths = this.searchPaths.concat(['/usr/bin/', '/usr/local/bin/']);
				break;
			}
		}
		const config = this.mongoConfig;
		this.mongoConfig = Mongod.parseConfig(config, {
			path: config.path ? config.path : this.find(),
			config: null,
			port: 27017,
			db: null,
			engine: 'mmapv1',
			nojournal: true,
			smallFiles: true,
			quite: true
		} as IMongoConfig);

		await this.canReadAndWrite(this.mongoConfig.db);

		mkdirp(this.mongoConfig.db, (err, made) => {
			if (err) {
				Promise.reject("Cant create MongoDB data base path : " + this.mongoConfig.db);
			} else {
				Promise.resolve(true);
			}
		});
		jet.remove(path.join(this.mongoConfig.db, 'mongod.lock'));
		return Promise.resolve(true);
	}

	//
	// ─── UTILS ──────────────────────────────────────────────────────────────────────
	//
	/*
	   * Parse process flags for MongoDB from a given {@link IMongoConfig}.
	   * @protected
	   * @argument {IMongoConfig} config
	   * @return {Array.<String>}
	   */
	protected static parseFlags(config: IMongoConfig) {
		if (config.config != null) {
			return ['--config', config.config];
		}

		const flags = [];

		if (config.nojournal) {
			flags.push('--nojournal');
		}

		if (config.smallfiles) {
			flags.push('--smallfiles');
		}

		if (config.engine != null) {
			if (!~arch.indexOf('64') !) {
				flags.push('--storageEngine', config.engine);
			}
		}

		if (config.db != null) {
			flags.push('--dbpath', config.db);
		}

		if (config.port != null) {
			flags.push('--port', config.port);
		}

		if (config.quite === true) {
			flags.push('--quiet');
		}

		return flags;
	}

	/*
	* Populate a given {@link IMongoConfig} with values from a given {@link IMongoConfig}.
	* @protected
	* @argument {IMongoConfig} source
	* @argument {IMongoConfig} target
	* @return {IMongoConfig}
	*/
	protected static parseConfig(source: IMongoConfig, target: IMongoConfig | null) {
		if (target == null) {
			target = Object.create(null);
		}
		if (source == null) {
			return target;
		}
		if (typeof source === 'number' || typeof source === 'string') {
			target.port = source;
			return target;
		}

		if (typeof source !== 'object') {
			return target;
		}
		if (source.path != null) {
			target.path = source.path;
		}
		if (source.config != null) {
			target.config = source.config;

			return target;
		}
		if (source.nojournal === true) {
			target.nojournal = true;
		}
		if (source.engine != null) {
			target.engine = source.engine;
		}
		if (source.db != null) {
			target.db = source.db;
		}
		if (source.port != null) {
			target.port = source.port;
		}
		if (source.quite != null) {
			target.quite = source.quite;
		}

		return target;
	}

	/*
	  * Parse MongoDB server output for terminal messages.
	  * @protected
	  * @argument {String} string
	  * @return {Object}
	  */
	protected static parseData(str: string): any {
		const matches = MessageRegEx.terminalMessage.exec(str);

		if (matches === null) {
			return null;
		}

		const result = {
			err: null,
			key: matches
				.pop()
				.replace(MessageRegEx.whiteSpace, '')
				.toLowerCase()
		};

		if (~str.indexOf('already in use')) {
			result.err = new Error('Address already in use');
			result.err.code = EError.ALREADY_IN_USE;
			return result;
		}

		if (~str.indexOf('initialize Performance Counters for FTDC')) {
			return null;
		}

		switch (result.key) {
			case 'waitingforconnections':
				break;

			case 'alreadyinuse':
				result.err = new Error('Address already in use');
				result.err.code = EError.ALREADY_IN_USE;
				break;

			case 'denied':
				result.err = new Error('Permission denied');
				result.err.code = EError.DENIED;
				break;

			case 'error':
			case 'exception':
			case 'badvalue':
				result.err = new Error(str.trim());
				result.err.code = EError.ERROR;
				break;
		}
		return result;
	}

	static getTextLineAggregator(callback) {
		let buffer = '';
		return (data) => {
			const fragments = data.toString().split(MessageRegEx.newline);
			const lines = fragments.slice(0, fragments.length - 1);

			// If there was an unended line in the previous dump, complete it by
			// the first section.
			lines[0] = buffer + lines[0];

			// If there is an unended line in this dump, store it to be completed by
			// the next. This assumes there will be a terminating newline character
			// at some point. Generally, this is a safe assumption.
			buffer = fragments[fragments.length - 1];

			for (let line of lines) {
				callback(line);
			}
		};
	}
}
