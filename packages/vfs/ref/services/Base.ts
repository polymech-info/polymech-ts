import { Application } from '../interfaces/Application';
import { IObjectLiteral, JSONPathExpression, List } from '../interfaces/index';
import { DefaultDelimitter, EResourceType, FileResource, IResource, IResourceDriven } from '../interfaces/Resource';
import { IResourceProperty } from '../interfaces/Resource';
import { ResourceResolver } from '../resource/Resolver';
import { JSONRPC } from '../rpc/JSON-RPC-2';
import * as utils from '../utils/StringUtils';
import { serialize, deserialize } from '../io/json';
import * as fs from 'fs';
import * as _ from 'lodash';
import * as mkdirp from 'mkdirp';
import * as _path from 'path';

const write = require('write-file-atomic');
const qs = require('qs').parse;
const url = require('url');
import * as pathUtil from 'path';
export interface IService {
	method: string;
	methods(): any;
	readConfig(path?: string): IObjectLiteral;
	writeConfig(path?: string, val?: IObjectLiteral): void;
}

export type Config = string & IObjectLiteral;
const permissionError = 'You don\'t have access to this file.';
const defaultPathMode: number = parseInt('0700', 8);
const writeFileOptions: IObjectLiteral = { mode: parseInt('0600', 8) };
const io = {
	parse: deserialize,
	serialize: serialize
};

/**
 * Decorator to mark a method as RPC method (in this.rpcMethods), collected during service registratation.
 *
 * @param {Object} target
 * @param {string} propName
 * @param {*} propertyDescriptor
 */
export const RpcMethod = (target: Object, propName: string, propertyDescriptor: any): void => {
	const desc = Object.getOwnPropertyDescriptor(target, "getRpcMethods");
	if (desc && desc.configurable) {
		Object.defineProperty(target, "getRpcMethods", { value: function () { return this["rpcMethods"]; }, configurable: false });
		Object.defineProperty(target, "rpcMethods", { value: [] });
	}
	target && target["rpcMethods"] && target["rpcMethods"].push(propName);
};

export class BaseService extends ResourceResolver implements IService, IResourceDriven {
	WRITE_MODE: IObjectLiteral = writeFileOptions;
	method = 'no_method';
	relativeVariables: any;
	absoluteVariables: any;
	configPath: string;
	rpc: JSONRPC;
	application: Application;
	init(): void {

	}
	_userDir(userRoot: string, what: string) {
		return pathUtil.resolve(pathUtil.join(userRoot + pathUtil.sep + what));
	}
	_getConfigPath(args: IArguments): string {
		const user = this._getUser(this._getRequest(args));
		let configPath = this.configPath;
		if (user) {
			configPath = this._userDir(user, 'settings.json');
		}
		return configPath;
	}

	_getUser(request: any) {
		if (request) {
			// pick userDirectory from referrer (xide RPC calls don't have it has it as url parameter )
			let urlArgs = qs(request.get('referrer'));
			let user: string = urlArgs['userDirectory'];
			if (user) {
				return user;
			}
			// try to pick userDirectory from url
			urlArgs = request.query;
			user = urlArgs['userDirectory'];
			if (user) {
				return user;
			}
		}
	}

	public _getRequest(args: any): any | null {
		for (let i = 0; i < args.length; i++) {
			if (args[i] && args[i]['get'] && args[i]['socket']) {
				return args[i];
			}
		}
		return null;
	}

	constructor(config: string, relativeVariables: any, absoluteVariables: any) {
		super(config, relativeVariables, absoluteVariables);
	}

	public getRpcMethods(): string[] {
		throw new Error('Should be implemented by decorator');
	}

	methods() {
		const methods = this.getRpcMethods();
		return this.toMethods(methods);
	}

	readConfig(path?: string, _default?: string): any {
		path = path || this.configPath;
		try {
			return io.parse(fs.readFileSync(path, 'utf8'));
		} catch (err) {
			// create dir if it doesn't exist
			if (err.code === 'ENOENT') {
				mkdirp.sync(_path.dirname(path), defaultPathMode);
				write.sync(path, _default || '', writeFileOptions);
				return {};
			}
			// improve the message of permission errors
			if (err.code === 'EACCES') {
				err.message = err.message + '\n' + permissionError + '\n';
			}
			// empty the file if it encounters invalid JSON
			if (err.name === 'SyntaxError') {
				write.sync(path, '', writeFileOptions);
				return {};
			}
			throw err;
		}
	}

	public writeConfig(path?: string, val?: IObjectLiteral): void {
		path = path || this.configPath;
		val = val || this.readConfig(path);
		try {
			// make sure the folder exists as it
			// could have been deleted in the meantime
			mkdirp.sync(_path.dirname(path), defaultPathMode);
			write.sync(path, serialize(val, null, 4), writeFileOptions);
		} catch (err) {
			// improve the message of permission errors
			if (err.code === 'EACCES') {
				err.message = err.message + '\n' + permissionError + '\n';
			}
			throw err;
		}
	}

	public toMethods(methods: Array<string>): IObjectLiteral {
		const self = this;
		const result: IObjectLiteral = {};
		_.each(methods, (method: string) => {
			result[method] = (<any>self)[method];
		});
		return result;
	}

	public resolveAbsolute(resource: IResource, property?: string): string {
		if (!property) {
			switch (resource.type) {
				case EResourceType.JS_HEADER_INCLUDE:
				case EResourceType.JS_HEADER_SCRIPT_TAG:
				case EResourceType.CSS: {
					property = 'url';
					break;
				}
				case EResourceType.FILE_PROXY: {
					property = "path";
					break;
				}
			}
		}
		return utils.replace((<IResourceProperty>resource)[property], null, this.absoluteVariables, DefaultDelimitter());
	}

	_resolveUserMount(mount: string, request: any, _default?: string): string {
		return _default;
	}

	public resolve(mount: string, path: string, request?: any): string | null {
		const resource = this.getResourceByTypeAndName(EResourceType.FILE_PROXY, mount);
		if (resource) {
			let userRoot: string = this.resolveAbsolute(resource as FileResource);
			if (request) {
				userRoot = this._resolveUserMount(mount, request, userRoot);
			}
			return _path.join(userRoot, path);
		}
		return null;
	}

	public resources(): List<IResource> {
		const config = this.readConfig(this.configPath);
		if (config) {
			return config.items;
		}
		return [];
	}

	public getResourceByTypeAndName(type: EResourceType, name: string): IResource | null {
		const resources = this.resources() as List<IResource>;
		if (resources) {
			return _.find(resources, {
				type: type,
				name: name
			});
		}
		return null;
	}
}

export function decodeArgs(args, path: JSONPathExpression | null, decoder: Function): IObjectLiteral | null {
	try {
		decoder(args, path);
	} catch (e) {
		throw new Error('Decoding args  failed ' + path);
	}
	return args;
}
