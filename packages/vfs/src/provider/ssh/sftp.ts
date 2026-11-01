import { Client, SFTPWrapper } from 'ssh2';
import { FileEntry, Stats } from 'ssh2-streams';
import * as fs from 'fs';
import * as pathUtil from 'path';
import { IObjectLiteral } from '../../interfaces/index';
import { INode } from '../../interfaces/VFS';
import { Path } from '../../model/Path';
import { IDeleteOptions } from '../../fs/interfaces';
import { FileResource, EResourceType } from '../../interfaces/Resource';

export interface IDefaultParameters {
	host: string;
	port: number;
	user: string;
	password?: string;
	key?: string;
	root?: string;
}

export type SFTPResource = FileResource & {
	options: IDefaultParameters;
};

export class VFS {
	protected client: Client;
	protected sftp: SFTPWrapper;
	readonly resource: SFTPResource;
	// initial options
	readonly options: IDefaultParameters;

	constructor(resource: SFTPResource) {
		this.resource = resource;
		this.options = this.parseOptions(resource.options);
		this.init();
	}
	/**
	 * Map internal node rep. to public INode
	 *
	 * @param {ITreeBlobNode} node
	 * @param {string} mount
	 * @param {IObjectLiteral} options
	 * @returns {INode}
	 *
	 * @memberOf VFS
	 */
	private mapNode(root: string, node: FileEntry, stats: Stats, mount?: string, options?: IObjectLiteral): INode {
		const directory = stats.isDirectory();
		const abs = new Path('./' + root + '/' + node.filename).toString().replace(this.options.root, '');
		const parent = new Path(abs, false, false).getParentPath();
		return {
			path: Path.normalize('./' + abs),
			sizeBytes: node.attrs.size,
			size: node.attrs.size,
			mtime: node.attrs.mtime,
			atime: node.attrs.atime,
			owner: {
				user: null,
				group: null
			},
			isDir: directory,
			directory: directory,
			mime: !directory ? 'file' : 'folder',
			name: pathUtil.win32.basename(node.filename),
			fileType: directory ? 'folder' : 'file',
			mount: mount,
			parent: Path.normalize("./" + parent.toString()),
			type: ''
		} as INode;
	}

	private async list(path: string): Promise<any[]> {
		return new Promise<any[]>((resolve, reject) => {
			let sftp = this.sftp;
			if (sftp) {
				sftp.readdir(path, (err, list) => {
					if (err) {
						reject(err);
						return false;
					}
					// reset file info
					list.forEach((item, i) => {
						const _item = list[i];
						_item['name'] = item.filename;
						_item['type'] = item.longname.substr(0, 1);
					});
					resolve(list);
				});
			} else {
				reject('sftp connect error');
			}
		});
	}
	private async _delete(path) {
		return new Promise((resolve, reject) => {
			let sftp = this.sftp;

			if (sftp) {
				sftp.unlink(path, (err) => {
					if (err) {
						reject(err);
						return false;
					}
					resolve();
				});
			} else {
				reject('sftp connect error');
			}
		});
	};

	public async remove(path: string, options?: IDeleteOptions): Promise<boolean> {
		return new Promise<boolean>((resolve, reject) => {
			this.init().then(() => {
				path = this.resolve(path);
				this.sftp.stat(path, (err, stats) => {
					if (stats.isDirectory()) {
						/*
						this.sftp.rmdir(path, (err) => {
							err ? reject(err) : resolve(true);
						});
						*/
						let rmdir = (p) => {
							return this.list(p).then((list) => {
								if (list.length > 0) {
									let promises = [];
									list.forEach((item) => {
										let name = item.name;
										let promise;
										let subPath;
										if (name[0] === '/') {
											subPath = name;
										} else {
											if (p[p.length - 1] === '/') {
												subPath = p + name;
											} else {
												subPath = p + '/' + name;
											}
										}

										if (item.type === 'd') {
											if (name !== '.' || name !== '..') {
												promise = rmdir(subPath);
											}
										} else {
											promise = this._delete(subPath);
										}
										promises.push(promise);
									});
									if (promises.length) {
										return Promise.all(promises).then(() => {
											return rmdir(p);
										});
									}
								} else {
									return new Promise((resolve, reject) => {
										return this.sftp.rmdir(p, (err) => {
											if (err) {
												reject(err);
											}
											else {
												resolve();
											}
										});
									});
								}
							});
						};
						return rmdir(path).then(() => { resolve(); });
					} else {
						this.sftp.unlink(path, (err) => {
							err ? reject(err) : resolve(true);
						});
					}
				});
			});
		});
	}

	public resolve(path: string): string {
		path = new Path(path, true, false).toString();
		if (path === '.') {
			path = '';
		}
		if (!path.startsWith('/')) {
			path = '/' + path;
		}
		return Path.normalize(this.options.root + '/' + path);
	}

	async ls(path: string = '/', mount?: string): Promise<INode[]> {
		path = this.resolve(path);
		return new Promise<INode[]>((resolve, reject) => {
			this.init().then(() => {
				const ret: INode[] = [];
				let nodes: FileEntry[] = [];
				const proceed = () => {
					if (!nodes.length) {
						resolve(ret);
						return;
					}
					const next = nodes[0];
					this.sftp.stat(path + '/' + next.filename, (err, stats) => {
						if (err) {
							console.error('err', err);
							nodes.shift();
							proceed();
							return;
						}
						if (!stats) {
							console.error('cant get stats for ' + next.filename + ' with path query ' + path);
							nodes.shift();
							proceed();
							return;
						}
						ret.push(this.mapNode(path, next, stats, mount));
						nodes.shift();
						proceed();
					});
				};
				this.sftp.readdir(path, (err, files: FileEntry[]) => {
					if (err) {
						reject(err);
					}
					if (files) {
						nodes = files;
					} else {
						console.error('have no files at ' + path, err);
						reject(err);
					}
					proceed();
				});
			});
		});
	}
	async init(): Promise<boolean> {
		this.client = new Client();
		return new Promise<boolean>((resolve, reject) => {
			this.client.on('error', reject);
			this.client.on('ready', () => {
				this.client.sftp((err, sftp) => {
					this.sftp = sftp;
					resolve(true);
				});
			}).connect({
				host: this.options.host,
				port: this.options.port,
				username: this.options.user,
				privateKey: this.options.key,
				password: this.options.password
			});
		});
	}
	parseOptions(options: IDefaultParameters | null): IDefaultParameters {
		if (typeof options === "undefined") {
			throw new Error('options hash is required!');
		}
		options = options || {} as IDefaultParameters;
		options.host = options.host || "localhost";
		options.port = options.port || 22;
		options.user = options.user || "mc007";
		options.password = options.password || null;
		options.root = options.root || '/';
		if (options.key && fs.existsSync(options.key)) {
			options.key = require('fs').readFileSync(options.key);
		}
		return options;
	}

}
export function test() {
	const ab = true;
	if (ab) {
		return;
	}
	let o: IDefaultParameters = {
		host: '192.168.1.37',
		user: 'mc',
		port: 22,
		password: ''
	};
	let or: IDefaultParameters = {
		host: 'pearls-media.com',
		user: 'vu2003',
		port: 22,
		key: '/home/mc007/.ssh/id_rsa'
	};
	let r: SFTPResource = {
		options: or,
		enabled: true,
		name: 'sftp',
		path: '',
		readOnly: false,
		type: EResourceType.FILE_PROXY,
		label: '',
		vfs: '',
		url: ''
	};

	let vfs = new VFS(r);
	vfs.ls('/var/www/virtual/pearls-media.com').then((nodes) => {
		console.log('node', [nodes[0], nodes[1]]);
	});
	// console.log('vfs', vfs);
}
// test();
