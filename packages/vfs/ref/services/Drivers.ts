import { IObjectLiteral } from '../interfaces/index';
import { EResourceType, FileResource } from '../interfaces/Resource';
import { IServiceConfiguration } from '../interfaces/Service';
import { DRIVER_PROPERTY } from '../types/Driver';
import { getCIInputValueByName } from '../utils/CIUtils';
import { replaceAll } from '../utils/StringUtils';
import { RpcMethod } from './Base';
import { BeanService } from './Bean';

import * as fs from 'fs';
import * as _ from 'lodash';
import * as pathUtil from 'path';
import * as path from 'path';
import { async as fsIterator } from '../fs/iterator';
import { ArrayIterator } from '@xblox/core/iterator';
import { IProcessingNode } from '../fs/interfaces';
import { URI, parentURI } from '../fs/uri';
import { read, deserialize } from '../io/json';


const META_FILE_EXT = '.meta.json';

export async function drivers(where: string, scope: string, serverSide: boolean = false): Promise<any> {
	return new Promise((resolve, reject) => {
		fsIterator(where, {
			matching: ['**/*' + META_FILE_EXT]
		}).then((it: ArrayIterator<IProcessingNode>) => {
			let node: IProcessingNode = null;
			let nodes: any[] = [];
			while (node = it.next()) {
				let parent = path.dirname(node.path).replace(where, '');
				if (parent.startsWith(path.sep)) {
					parent = parent.replace(path.sep, '');
				}
				const name = path.basename(node.path).replace(META_FILE_EXT, '');
				let _path = parent + path.sep + path.basename(node.path);
				if (_path.startsWith(path.sep)) {
					_path = _path.replace(path.sep, '');
				}

				const item = {
					name: name,
					parentId: parent,
					isDir: node.item.type === 'directory',
					scope: scope,
					path: replaceAll('\\', '/', _path)
				};

				const meta = deserialize(read(node.path));
				if (!meta) {
					return;
				}
				item['user'] = meta;

				item['id'] = getCIInputValueByName(meta, DRIVER_PROPERTY.CF_DRIVER_ID);

				let bloxFile = node.path.replace('.meta.json', '.xblox');

				if (bloxFile.indexOf('Default.xblox') !== -1) {
					continue;
				}

				try {
					let blox = deserialize(read(bloxFile));
					if (!blox) {
						console.warn('invalid blocks file for driver ' + name + ' at ' + bloxFile);
					}
					item['blox'] = blox;
					item['blockPath'] = bloxFile;
				} catch (e) {
					console.error('error reading blox file ' + bloxFile, e);
				}


				nodes.push(item);

				// add parent if not already
				if (!_.find(nodes, {
					path: item.parentId
				})) {
					const _parent = parentURI(URI.file(path.dirname(node.path)));
					if (_parent.fsPath.indexOf(where) !== -1) {
						nodes.push({
							name: item.parentId,
							path: item.parentId,
							scope: scope,
							isDir: true,
							parentId: _parent.fsPath.replace(where, '')
						});
					}
				}
			}
			resolve(nodes);
		});
	});
}


export class DriverService extends BeanService {
	public method = 'XCF_Driver_Service';
	public config: IServiceConfiguration;
	async getDrivers(driverPath: string, scope: string, options: IObjectLiteral) {
		return drivers(driverPath, scope);
	}
	@RpcMethod
	async updateItemMetaData(path: string, mount: string, options: any, recursive: boolean = false) {
		return this._updateItemMetaData.apply(this, arguments);
	}
	@RpcMethod
	async ls(mount: string, _path: string, options: any, recursive: boolean = false, req?: any): Promise<IObjectLiteral> {
		try {
			const resource = this.getResourceByTypeAndName(EResourceType.FILE_PROXY, mount);
			if (resource) {
				let root = this._resolveUserMount(mount, this._getRequest(arguments)) || this.resolveAbsolute(resource as FileResource);
				const nodes = await drivers(root, mount) as Array<any>;
				return { items: nodes };
			} else {
				console.warn('cant find resource for ' + mount);
			}
		} catch (e) {
			console.error(e);
		}
	}
	@RpcMethod
	public removeItem(mount: string, _path: string): Promise<boolean> {
		const args: any = arguments;
		return new Promise((resolve, reject) => {
			const vfs = this.getVFS(mount, this._getRequest(args));
			if (vfs) {
				vfs.rm(this.resolvePath(mount, _path), {}, resolve, reject);
				vfs.rm(this.resolvePath(mount, _path.replace('.meta.json', '.js')), {}, resolve, reject);
				vfs.rm(this.resolvePath(mount, _path.replace('.meta.json', '.xblox')), {}, resolve, reject);
				resolve(true);
			} else {
				reject('Cant find VFS for ' + mount);
			}
		});
	}
	// implement IBean#create & IDirectoryService#@touch
	@RpcMethod
	async createItem(mount: string, _path: string, title: string, meta: string, driverCode: string): Promise<any> {
		const args: any = arguments;
		return new Promise((resolve, reject) => {
			try {
				const vfs = this.getVFS(mount, this._getRequest(args));
				if (vfs) {
					this.mkfile(mount, _path + pathUtil.sep + title + '.meta.json', meta);
					this.mkfile(mount, _path + pathUtil.sep + title + '.js', driverCode);
					this.mkfile(mount, _path + pathUtil.sep + title + '.xblox', '{}');
					resolve(meta);
				} else {
					reject('Cant find VFS for ' + mount);
				}
			} catch (e) {
				console.error('Error creating driver', e);
			}
		});
	}
	// implement IBean#createGroup & IDirectoryService#@mkdir
	@RpcMethod
	public createGroup(mount: string, _path: string): Promise<boolean> {
		const args: any = arguments;
		return new Promise((resolve, reject) => {
			const vfs = this.getVFS(mount, this._getRequest(args));
			if (vfs) {
				vfs.exists(_path).then((exists) => {
					if (exists) {
						return resolve(true);
					} else {
						vfs.mkdir(_path, {}, (err, data) => {
							err ? reject(err) : resolve(true);
						});
					}
				});
			} else {
				reject('Cant find VFS for ----' + mount);
			}
		});
	}
	// implement IBean#removeGroup & IDirectoryService#@rm
	@RpcMethod
	public removeGroup(mount: string, _path: string): Promise<boolean> {
		const args: any = arguments;
		return new Promise((resolve, reject) => {
			const vfs = this.getVFS(mount, this._getRequest(args));
			if (vfs) {
				Promise.resolve(vfs.rmdir(this.resolvePath(mount, _path), {}, resolve, reject));
			} else {
				reject('Cant find VFS for ' + mount);
			}
		});
	}

	//
	// ─── DECORATOR OVERHEAD ─────────────────────────────────────────────────────────
	//
	public getRpcMethods(): string[] {
		throw new Error("Should be implemented by decorator");
	}

	methods() {
		return this.toMethods(this.getRpcMethods().concat(['get', 'set']));
	}
}

export function getDrivers(driverPath: string, scope: string, options?: IObjectLiteral) {
	const service = new DriverService(null);
	return service.getDrivers(driverPath, scope, options);
}
