import { IObjectLiteral } from '../interfaces/index';
import { IStoreAccess, IStoreIO } from '../interfaces/Store';
import { BaseService, RpcMethod } from '../services/Base';
import * as dotProp from 'dot-prop';
import * as _ from 'lodash';
import * as pathUtil from 'path';
const defaultFileName = 'settings.json';
import { sync as existsSync } from '../fs/exists';
import { sync as writeSync } from '../fs/write';
const debug = false;
/**
 * This service sets/gets data in a json file, utilizing 'dot-prop' to select certain data in the object.
 *
 * @export
 * @class JSONFileService
 * @extends {BaseService}
 * @implements {IStoreIO}
 * @implements {IStoreAccess}
 */
export class JSONFileService extends BaseService implements IStoreIO, IStoreAccess {
	public method = 'XApp_Store';
	public root: string;
	public defaultFileName: string = defaultFileName;
	public defaultData: any = {
		'admin': {
			'settings': []
		}
	};

	constructor(config: string) {
		super(config, null, null);
		this.configPath = config;
		this.root = 'admin';
	}

	_ensure(path: string) {
		if (path || path.length) {
			debug && console.error('ensure invalid path !');
			return;
		}
		try {
			if (path && path.length && !existsSync(path)) {
				writeSync(path, this.defaultData);
			}
		} catch (e) {
			debug && console.error('ensure failed : ' + path);
		}
	}

	_userDir(userRoot: string, what: string) {
		return pathUtil.resolve(pathUtil.join(userRoot + pathUtil.sep + what));
	}

	_getConfigPath(args: IArguments, file?: string): string {
		file = file || this.defaultFileName;
		const user = this._getUser(this._getRequest(args));
		let configPath = this.configPath;
		if (user) {
			configPath = this._userDir(user, file || 'settings.json');
		}
		this._ensure(configPath);
		return configPath;
	}

	@RpcMethod
	public get(section: string, path: string, query?: any): IObjectLiteral {
		let configPath = this._getConfigPath(arguments);
		if (!configPath || !configPath.length) {
			debug && console.error('get failed!, invalid path ' + configPath + ' for secction ' + section + ' & path = ' + path);
			return [];
		}
		let data = this.readConfig(configPath);
		let result: IObjectLiteral = {};
		result[section] = dotProp.get(data, this.root + path + section);
		return result;
	}

	@RpcMethod
	public set(
		section: string, path: string = '.',
		searchQuery: any = null,
		value: any,
		decodeValue: boolean = true,
		request?: any) {

		let data = this.readConfig(this._getConfigPath(arguments));

		const dataAt = dotProp.get(data, this.root + path + section);
		if (!_.find(dataAt, searchQuery)) {
			const at = dotProp.get(data, this.root + path + section);
			at.push(searchQuery);
		}
		dataAt && _.extend(_.find(dataAt, searchQuery), value);
		return data;
	}

	@RpcMethod
	public update(section: string, path: string = '.', searchQuery: any = null, value: any = null, decodeValue: boolean = true, request?: any) {
		return this.writeConfig(
			this._getConfigPath(arguments), this.set(section, path, searchQuery, value, decodeValue, this._getRequest(arguments)));
	}
	public read(path?: string): IObjectLiteral {
		return this.readConfig(this._getConfigPath(arguments));
	}
	public write(path?: string, val?: Object): void {
		this.writeConfig(path, val);
	}
	//
	// ─── DECORATORS
	//
	public getRpcMethods(): string[] {
		throw new Error("Should be implemented by decorator");
	}
	methods() {
		const methods = this.getRpcMethods();
		return this.toMethods(methods);
	}
}
