import { EResourceType, FileResource, IResourceDriven } from '../interfaces/Resource';
import { INode, VFS_PATH } from '../interfaces/VFS';
import { IObjectLiteral } from '../interfaces/index';
import { to as DECODE_BASE_64 } from '../io/base64';
import { before } from '../lang/AspectDecorator';
import { BaseService, decodeArgs } from '../services/Base';
import { create as createLocalVFS } from '../vfs/Local';
import * as fs from 'fs';
const mime = require('mime');
import * as _path from 'path';
import * as _ from 'lodash';
import { RpcMethod } from './Base';
import { Path } from '../model/Path';
// import { VFS as GithubVFS, GithubResource } from '../vfs/github/Github';
// import { test as testSFTP } from '../vfs/ssh/sftp';
import { VFS as SFTPVFS, SFTPResource } from '../vfs/ssh/sftp';
import { sync as copy } from '../fs/copy';
import { sync as exists } from '../fs/exists';
import { ICopyOptions } from '../fs/interfaces';
// import * as jet from 'fs-jetpack';
import * as  mkdirp from 'mkdirp';
let posix = null;
const _fs = require('node-fs-extra');
try {
	posix = require('posix');
} catch (e) { }
const DEBUG = false;
const posixCache: IObjectLiteral = {};

export function FileSizeToString(size: any): string {
	const isNumber = typeof size === 'number',
		l1KB = 1024,
		l1MB = l1KB * l1KB,
		l1GB = l1MB * l1KB,
		l1TB = l1GB * l1KB,
		l1PB = l1TB * l1KB;

	if (isNumber) {
		if (size < l1KB) {
			size = size + 'b';
		}
		else if (size < l1MB) { size = (size / l1KB).toFixed(2) + 'kb'; }
		else if (size < l1GB) { size = (size / l1MB).toFixed(2) + 'mb'; }
		else if (size < l1TB) { size = (size / l1GB).toFixed(2) + 'gb'; }
		else if (size < l1PB) { size = (size / l1TB).toFixed(2) + 'tb'; }
		else { size = (size / l1PB).toFixed(2) + 'pb'; }
	}
	return size;
}
export class DirectoryService extends BaseService {
	// implement Base#method for JSON_RPC2: method = XCOM_Directory_Service.fn
	public method = 'XCOM_Directory_Service';
	constructor(config: IResourceDriven) {
		super(config.configPath, config.relativeVariables, config.absoluteVariables);
	}
	// implement BaseService#init
	init(): void {
	}
	// implement IVFS#get for non sending mode
	private _get(path: string, attachment: boolean, send: boolean, request?: any): Promise<string> {
		const args = arguments;
		return new Promise<string>((resolve, reject) => {
			const split = path.split('://');
			const mount = split[0];
			const vfs = this.getVFS(mount, this._getRequest(args));
			path = split[1];
			if (!vfs) {
				reject('Cant find VFS for ' + mount);
			}
			try {
				vfs.get(path).then(resolve, reject);
				return;
			} catch (e) {
				reject(e);
			}
		});
	}

	// implement IVFS#get
	// @before((context, args) => validateArgs(args)
	// @TODO: remove back-compat for xfile
	@RpcMethod
	@before((context, args) => decodeArgs(args, '$[\'0\']', DECODE_BASE_64))
	async get(path: string, attachment: boolean, send: boolean, dummy: boolean = false, reqest: any = null): Promise<string> {
		if (!attachment && !send) {
			return await this._get(path, attachment, send, reqest);
		}
	}
	// implement IVFS#set
	@RpcMethod
	set(mount: string, path: string, content: string, reqest: any = null): Promise<boolean> {
		const args = arguments;
		return new Promise<boolean>((resolve, reject) => {
			const vfs = this.getVFS(mount, this._getRequest(args));
			if (vfs) {
				// IVFS - 2.0
				if (typeof vfs['set'] === 'function') {
					vfs.set(path, content).then(() => resolve(true));
					return;
				}
				// IVFS 1.0
				vfs.writefile(this.resolvePath(mount, path, this._getRequest(args)), content, this.WRITE_MODE);
				resolve(true);
			} else {
				reject('Cant find VFS for ' + mount);
			}
		});
	}
	// implement IVFS#rename
	@RpcMethod
	async rename(mount: string, path: string, newFileName: string, dummy: boolean): Promise<boolean> {
		const args = arguments;
		return new Promise<boolean>((resolve, reject) => {
			const vfs = this.getVFS(mount, this._getRequest(args));
			if (vfs) {
				vfs.rename(path, { to: newFileName }, (err, meta) => {
					err ? reject(err) : resolve(true);
				});
			} else {
				reject('Cant find VFS for ' + mount);
			}
		});
	}
	// implement IVFS#mkdir
	@RpcMethod
	async mkdir(mount: string, path: string, reqest: any = null): Promise<boolean> {
		const args = arguments;
		return new Promise<boolean>((resolve, reject) => {
			const vfs = this.getVFS(mount, this._getRequest(args));
			if (vfs) {
				const resolved = this.resolvePath(mount, path, this._getRequest(args));
				mkdirp.sync(resolved);
				resolve(true);
				/*
				return;
				vfs.mkdir(path, {}, (err, data) => {
					if (err) {
						reject("error reading file : " + err);
					} else {
						resolve(true);
					}
				});
				resolve(true);
				*/
			} else {
				reject('Cant find VFS for ' + mount);
			}
		});
	}
	// implement IVFS#@touch
	@RpcMethod
	async mkfile(mount: string, _path: string, content: string): Promise<boolean> {
		const args = arguments;
		return new Promise<boolean>((resolve, reject) => {
			const vfs = this.getVFS(mount, this._getRequest(args));
			const resolved = this.resolvePath(mount, _path, this._getRequest(args));
			if (vfs) {
				if (fs.existsSync(resolved)) {
					resolve(true);
					return;
				}
				_fs.outputFile(resolved, content || '', function (error) {
					if (error) {
						reject('Error writing file: ' + error);
					} else {
						resolve(true);
					}
				});
			} else {
				reject('Cant find VFS for ' + mount);
			}
		});
	}
	public resolveShort(_path: string): VFS_PATH {
		if (_path.startsWith('/')) {
			_path = _path.replace('/', '');
		}
		const mount = _path.split('/')[0];
		let parts = _path.split('/');
		parts.shift();
		return {
			mount: mount,
			path: parts.join('/')
		};
	}
	private getFiles(dir): string[] {
		const result: string[] = [];
		const files: string[] = fs.readdirSync(dir);
		for (let i in files) {
			typeof files[i] === 'string' && result.push(files[i]);
		}
		return result;
	}
	// implement IVFS#@cp
	@RpcMethod
	async copy(selection: string[], dst: string, options?: any, dummy: boolean = true, reqest: any = null): Promise<boolean> {
		const args = arguments;
		return new Promise<boolean>((resolve, reject) => {
			let destParts = this.resolveShort(dst);
			const dstVFS = this.getVFS(destParts.mount, this._getRequest(args));
			if (!dstVFS) {
				reject('Cant find target VFS for ' + destParts.mount);
			}
			const targetDirectory = this.resolvePath(destParts.mount, destParts['path'], this._getRequest(args));
			let errors: Array<string> = [];
			// let success: Array<string> = [];
			let others = this.getFiles(targetDirectory);
			const newName = (name: string) => {
				let ext = _path.extname(name);
				let fileName = _path.basename(name, ext);
				let found = false;
				let i = 1;
				let newName = null;
				while (!found) {
					newName = fileName + '-' + i + ext;
					const colliding = others.indexOf(newName);
					if (colliding !== -1) {
						i++;
					} else {
						found = true;
					}
				}
				return newName;
			};
			let coptions: ICopyOptions = {
				overwrite: true
			};
			_.each(selection, (path) => {
				let srcParts: VFS_PATH = this.resolveShort(path);
				let srcPath = this.resolvePath(srcParts.mount, srcParts.path, this._getRequest(args));
				const srcVFS = this.getVFS(srcParts.mount, reqest);
				if (!srcVFS) {
					reject('Cant find VFS for ' + srcParts.mount);
				}
				const _exists = others.indexOf(_path.basename(srcPath)) !== -1;
				const newPath = _exists ?
					(targetDirectory + _path.sep + newName(_path.basename(srcPath))) :
					(targetDirectory + _path.sep + _path.basename(srcPath));

				try {
					if (exists(srcPath)) {
						copy(srcPath, newPath, coptions);
					} else {
						errors.push("cp : doesnt exists " + _path.basename(srcPath));
					}
				} catch (e) {
					console.error('cp error');
				}
			});
			_.isEmpty(errors) ? resolve(true) : reject(errors.join('\\'));
		});

	}
	// implement IVFS#rm
	// @TODO: ugly back compat for xphp in here!
	@RpcMethod
	public delete(selection: string[], options?: any, reqest: any = null): Promise<boolean> {
		const args = arguments;
		return new Promise<boolean>((resolve, reject) => {
			const first = selection[0];
			const mount = first.split('/')[0];
			const vfs = this.getVFS(mount, this._getRequest(args));
			let error = null;
			if (!vfs) {
				reject('Cant find VFS for ' + mount);
			}
			// VFS 2.0
			if (typeof vfs['remove'] === 'function') {
				let paths = selection.map((_path: string) => {
					let parts = _path.split('/');
					parts.shift();
					return parts.join('/');
				});

				const ops: Promise<any>[] = [];
				paths.forEach((path) => { ops.push(vfs.remove(path)); });
				Promise.all(ops).then(() => { resolve(true); }).catch(reject);
				return;
			}
			selection.forEach((_path) => {
				let parts = _path.split('/');
				parts.shift();
				_path = parts.join('/');
				try {
					vfs.rm(this.resolvePath(mount, _path, this._getRequest(args)), {}, resolve, reject);
				} catch (e) {
					reject(e);
				}
			});
			error ? reject(error) : resolve(true);
		});
	}
	createVFSClass(resource: FileResource): any {
		// if (resource.vfs === 'github') {
		// return new GithubVFS(resource as GithubResource);
		// }
		if (resource.vfs === 'sftp') {
			return new SFTPVFS(resource as SFTPResource);
		}
	}
	/**
	 *
	 * @param {string} mount
	 * @param {*} [request]
	 * @returns
	 *
	 * @memberOf DirectoryService
	 */
	public getVFS(mount: string, request?: any) {
		const resource = this.getResourceByTypeAndName(EResourceType.FILE_PROXY, mount);
		if (resource) {
			let root = this._resolveUserMount(mount, request) || this.resolveAbsolute(resource as FileResource);
			try {
				const vfsClass = (<FileResource>resource).vfs;
				// custom VFS class
				if (vfsClass) {
					return this.createVFSClass(resource as FileResource);
				}
				if (fs.lstatSync(root)) {
					return createLocalVFS({
						root: root,
						nopty: true
					}, resource);
				} else {
					console.error('Cant create VFS for mount ' + mount + ': vfs root doesnt exists');
				}
			} catch (e) {
				console.warn('cant get VFS for ' + mount + ' root : ' + root, e);
				console.log('this', this.absoluteVariables);
			}
		}
		return null;
	}

	public resolvePath(mount: string, path: string, request?: any): string | null {
		const resource = this.getResourceByTypeAndName(EResourceType.FILE_PROXY, mount);
		if (resource) {
			let abs = this.resolveAbsolute(resource as FileResource);
			if (request) {
				abs = this._resolveUserMount(mount, request, abs);
			}
			if (!abs == null || path == null) {
				console.error('error resolving path for mount ' + mount + '|' + path + '|' + abs, new Error().stack);
			}
			return _path.join(abs, path);
		} else {
			console.error('error resolving path, cant find resource for ' + mount + '/' + path);
		}
		return null;
	}

	private getOwner(uid: number) {
		if (posix) {
			if (posixCache[uid]) {
				return posixCache[uid];
			}
			const entry: IObjectLiteral = { name: (posix.getpwnam(uid) as IObjectLiteral)['name'] };
			return posixCache[uid] = entry;
		} else {
			return { name: 'unknown' };
		}
	}

	public mapNode(node: INode, mount: string, root: string) {
		const fsNodeStat = fs.statSync(node.path);
		const isDirectory = fsNodeStat.isDirectory();
		const nodePath = Path.normalize(node.path.replace(root, ''));
		const parent2 = new Path(nodePath, false, false).getParentPath();
		const result = {
			path: Path.normalize('.' + new Path(nodePath, false, false).segments.join('/')),
			sizeBytes: fsNodeStat.size,
			size: isDirectory ? 'Folder' : FileSizeToString(fsNodeStat.size),
			owner: {
				user: this.getOwner(fsNodeStat.uid),
				group: this.getOwner(fsNodeStat.gid)
			},
			mode: fsNodeStat.mode,
			isDir: isDirectory,
			directory: isDirectory,
			mime: isDirectory ? 'directory' : mime.getType(node.path),
			name: _path.win32.basename(node.path),
			fileType: isDirectory ? 'folder' : 'file',
			modified: fsNodeStat.mtime.getTime() / 1000,
			mount: mount,
			parent: Path.normalize('./' + parent2.segments.join('/'))
		};
		isDirectory && (result['_EX'] = false);
		return result;
	}

	public _ls(path: string, mount: string, options: any, recursive: boolean = false): Promise<IObjectLiteral> {
		const self = this, args = arguments;
		return new Promise((resolve, reject) => {
			const vfs = this.getVFS(mount, this._getRequest(args));
			if (!vfs) {
				reject(`cant get VFS for mount '${mount}'`);
			}

			// try v2 VFS
			if (typeof vfs.ls === 'function') {
				try {
					vfs.ls(path, mount, options).then((nodes) => { resolve(nodes); });
					return;
				} catch (e) {
					reject(e);
				}
			}

			// v1 VFS
			try {

				const root = this.resolvePath(mount, '', this._getRequest(args));

				// back compat : support filenames
				const abs = this.resolvePath(mount, path, this._getRequest(args));
				try {
					const stat = fs.lstatSync(abs);
					if (stat.isFile()) {
						path = _path.dirname(path);
					}
				} catch (e) { }

				vfs.readdir(path, {}, (err: Error, meta: any) => {
					if (err) {
						console.error('error reading directory ' + path);
						reject(err);
					}
					if (!meta) {
						reject('something wrong');
					}
					const nodes: Array<IObjectLiteral> = [];
					try {
						meta.stream.on('data', (data: any) => nodes.push(self.mapNode(data, mount, root)));
						meta.stream.on('end', () => {
							resolve(nodes);
						});
					} catch (e) {
						reject(e);
					}
				});
			} catch (e) {
				reject(e);
			}

		});
	}

	// implement IVFS#ls
	@RpcMethod
	async ls(path: string, mount: string, options: any, recursive: boolean = false, req?: any): Promise<IObjectLiteral> {
		const nodes: INode[] = await this._ls.apply(this, arguments);
		const root: IObjectLiteral = {
			items: [{
				_EX: true,
				children: nodes,
				mount: mount,
				name: path,
				path: path,
				directory: true,
				size: 0
			}]
		};
		DEBUG && console.log('nodes', nodes);
		return root;
	}

	//
	// ─── DECORATOR OVERHEAD ─────────────────────────────────────────────────────────
	//
	public getRpcMethods(): string[] {
		throw new Error('Should be implemented by decorator');
	}
	methods() {
		const methods = this.getRpcMethods();
		return this.toMethods(methods);
	}
}
