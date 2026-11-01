import { List } from '../interfaces';
import { CI, CIList, CIS } from '../interfaces/CI';
import { IServiceConfiguration } from '../interfaces/Service';
import { to as DECODE_JSON } from '../io/json';
import { before } from '../lang/AspectDecorator';
import { decodeArgs } from '../services/Base';
import { IDeviceNode, DEVICE_PROPERTY } from '../types/Device';
import { DRIVER_FLAGS } from '../types/Driver';
import { getCIByChainAndName, getCIInputValueByName } from '../utils/CIUtils';
import { RpcMethod } from './Base';
import { BeanService } from './Bean';
import * as fs from 'fs';
import * as _ from 'lodash';
import * as path from 'path';

const MKCI = getCIByChainAndName;
const DProp = DEVICE_PROPERTY, LFLAGS = DProp.CF_DEVICE_LOGGING_FLAGS;
const META_FILE_EXT = '.meta.json';
import { async as fsIterator } from '../fs/iterator';
import { ArrayIterator } from '@xblox/core/iterator';
import { IProcessingNode } from '../fs/interfaces';
import { URI, parentURI } from '../fs/uri';
import { read, deserialize } from '../io/json';


export async function devices(where: string, scope: string, serverSide: boolean = false): Promise<IDeviceNode[]> {
	return new Promise<IDeviceNode[]>((resolve, reject) => {
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

				const item: IDeviceNode = {
					name: name,
					parentId: parent,
					isDir: node.item.type === 'directory' ? true : false,
					scope: scope,
					path: _path
				};

				const meta = deserialize(read(node.path));
				if (!meta) {
					return;
				}
				if (serverSide) {
					const driverOptions = getCIByChainAndName(meta, 0, DEVICE_PROPERTY.CF_DEVICE_DRIVER_OPTIONS);
					if (driverOptions && !(driverOptions.value & (1 << DRIVER_FLAGS.RUNS_ON_SERVER))) {
						driverOptions.value = driverOptions.value | (1 << DRIVER_FLAGS.RUNS_ON_SERVER);
					}
				}
				item.user = meta;
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

export const MK_DEVICE_CIS = (cis: CIS): CI[] => {
	return [
		MKCI(cis, 0, DProp.CF_DEVICE_TITLE),
		MKCI(cis, 0, DProp.CF_DEVICE_HOST),
		MKCI(cis, 0, DProp.CF_DEVICE_ENABLED),
		MKCI(cis, 0, DProp.CF_DEVICE_DRIVER),
		MKCI(cis, 0, DProp.CF_DEVICE_PROTOCOL),
		MKCI(cis, 0, DProp.CF_DEVICE_PORT),
		MKCI(cis, 0, DProp.CF_DEVICE_ID),
		MKCI(cis, 0, DProp.CF_DEVICE_OPTIONS),
		MKCI(cis, 0, DProp.CF_DEVICE_DRIVER_OPTIONS),
		{
			"id": LFLAGS,
			"name": LFLAGS,
			"parentId": -1,
			"title": LFLAGS,
			"type": LFLAGS,
			"value": "{\n  \"Device Connected\": 47,\n  \"Response\": 35,\n  \"Send Command\": 51,\n  \"Device Disonnected\": 39,\n  \"Device Error\": 1\n}",
			"visible": true
		}
	];
};

export class DeviceService extends BeanService {
	public method = 'XCF_Device_Service';
	public config: IServiceConfiguration;

	@RpcMethod
	// eventually json string
	@before((context, args) => decodeArgs(args, "$['0']", DECODE_JSON))
	createItem(ciList: CIList): Promise<any> {
		const args: any = arguments;
		return new Promise((resolve, reject) => {
			const cis: CIS = { inputs: ciList };
			// 3 mand. fields to satisfy by client:  -> mount/folder/title (.meta.json)
			const scope: string = getCIInputValueByName(cis, 'Scope') as string;
			const title = getCIInputValueByName(cis, 'Title');
			const group = getCIInputValueByName(cis, 'In Group');
			const vfs = this.getVFS(scope, this._getRequest(args));
			if (!vfs) {
				reject('Cant find VFS for mount :' + scope);
			}
			const _CIS: List<CI> = MK_DEVICE_CIS(cis);
			const device: CIS = {
				inputs: _CIS
			};
			try {
				vfs.writefile(this.resolvePath(scope, path.sep + group + path.sep + title + META_FILE_EXT, this._getRequest(args)), JSON.stringify(device, null, 4), this.WRITE_MODE);
			} catch (e) {
				reject(e);
			}
			resolve(_CIS);
		});
	}

	async getItems(directory: string, scope: string, options?: any): Promise<any> {
		options = options || {};
		const serverSide = options.serverSide;
		return devices(directory, scope, serverSide);
	}

	@RpcMethod
	public removeGroup(mount: string, _path: string): Promise<boolean> {
		const args = arguments;
		return new Promise((resolve, reject) => {
			const vfs = this.getVFS(mount, this._getRequest(args));
			if (vfs) {
				const path = this.resolvePath(mount, _path, this._getRequest(args));
				vfs.rmdir(path, {}, resolve, reject);
				resolve(!fs.existsSync(path));
			} else {
				reject('Cant find VFS for ' + mount);
			}
		});
	}

	@RpcMethod
	public removeItem(mount: string, _path: string): Promise<boolean> {
		const args = arguments;
		return new Promise((resolve, reject) => {
			const vfs = this.getVFS(mount, this._getRequest(args));
			if (vfs) {
				const path = this.resolvePath(mount, _path, this._getRequest(args));
				vfs.rm(this.resolvePath(mount, _path, this._getRequest(args)), {}, resolve, reject);
				resolve(!fs.existsSync(path));
			} else {
				reject('Cant find VFS for ' + mount);
			}
		});
	}

	@RpcMethod
	public createGroup(mount: string, path: string): Promise<boolean> {
		const args = arguments;
		return new Promise((resolve, reject) => {
			const vfs = this.getVFS(mount, this._getRequest(args));
			if (vfs) {
				vfs.mkdir(path, {}, (err, data) => {
					err ? reject(err) : resolve(true);
				});
				resolve(fs.existsSync(path));
			} else {
				reject('Cant find VFS for ' + mount);
			}
		});
	}

	@RpcMethod
	ls(mount: string, path: string, options: any, recursive: boolean = false) {
		return this._ls.apply(this, arguments);
	}

	@RpcMethod
	updateItemMetaData(path: string, mount: string, options: any, recursive: boolean = false) {
		return this._updateItemMetaData.apply(this, arguments);
	}

	//
	// ─── DECORATOR OVERHEAD ─────────────────────────────────────────────────────────
	//

	public getRpcMethods(): string[] {
		throw new Error("Should be implemented by decorator");
	}

	methods() {
		return this.toMethods(this.getRpcMethods());
	}
}

export function getDevices(directory: string, scope: string, options: any): Promise<any> {
	const service = new DeviceService(null);
	return service.getItems(directory, scope, options);
}
