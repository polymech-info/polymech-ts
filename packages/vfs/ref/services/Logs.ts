import * as fs from 'fs';
import { RpcMethod } from '../services/Base';
import { BeanService } from './Bean';
const write = require('write-file-atomic');
export class LogsService extends BeanService {
	// implement Base#method
	public method = 'XIDE_Log_Service';
	// implement VFS#ls
	@RpcMethod
	async ls(path: string, mount: string, options: any, recursive: boolean = false) {
		const nodes = [];
		const root = {
			items: [{
				_EX: true,
				children: nodes,
				mount: mount,
				name: path,
				path: path,
				size: 0
			}]
		};
		return root;
	}
	// implement VFS#ls
	@RpcMethod
	async lsAbs(path: string) {
		return new Promise((resolve, reject) => {
			const first = path;
			const mount = first.split('/')[0];
			const vfs = this.getVFS(mount);
			if (!vfs) {
				reject('Cant find VFS for ' + mount);
			}
			let parts = path.split('/');
			parts.shift();
			path = parts.join('/');
			const pathAbs = this.resolvePath(mount, path);
			const entries = [];
			try {
				fs.statSync(pathAbs);
			}
			catch (e) {
				resolve(entries);
				return;
			}
			const lineReader = require('readline').createInterface({
				input: require('fs').createReadStream(pathAbs)
			});
			lineReader.on('line', function (line) {
				entries.push(JSON.parse(line));
			});
			lineReader.on('close', function (e) {
				resolve(entries);
			});
		});
	}
	@RpcMethod
	clearAbs(path: string) {
		const args = arguments;
		const request = this._getRequest(args);
		if (!request) {
			console.error('no request');
		}
		return new Promise((resolve, reject) => {
			const first = path;
			const mount = first.split('/')[0];
			const vfs = this.getVFS(mount, request);
			if (!vfs) {
				reject('Cant find VFS for ' + mount);
			}
			let parts = path.split('/');
			parts.shift();
			path = parts.join('/');
			const pathAbs = this.resolvePath(mount, path, request);
			write.sync(pathAbs, "", {});
		});
	}

	//
	// ─── DECORATORS ─────────────────────────────────────────────────────────────────
	//
	public getRpcMethods(): string[] {
		throw new Error("Should be implemented by decorator");
	}

	methods() {
		const methods = this.getRpcMethods();
		return this.toMethods(methods);
	}
}
