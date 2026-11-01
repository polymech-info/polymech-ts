import { IObjectLiteral } from '../../interfaces/index';
import { IStoreIO } from '../../interfaces/Store';
import { Memory } from './Memory';
import * as fs from 'fs';
import * as mkdirp from 'mkdirp';
import * as _path from 'path';
const writeFileAtomic = require('write-file-atomic');
const permissionError = 'You don\'t have access to this file.';
const defaultPathMode: number = parseInt('0700', 8);
const writeFileOptions: IObjectLiteral = { mode: parseInt('0600', 8) };
export class File extends Memory implements IStoreIO {
	configPath: string;
	read(path?: string): any {
		path = path || this.configPath;
		try {
			this._buckets = JSON.parse(fs.readFileSync(path, 'utf8'));
		} catch (err) {
			// create dir if it doesn't exist
			if (err.code === 'ENOENT') {
				mkdirp.sync(_path.dirname(path), defaultPathMode);
				return {};
			}
			// improve the message of permission errors
			if (err.code === 'EACCES') {
				err.message = err.message + '\n' + permissionError + '\n';
			}
			// empty the file if it encounters invalid JSON
			if (err.name === 'SyntaxError') {
				writeFileAtomic.sync(path, '', writeFileOptions);
				return {};
			}
			throw err;
		}
	}
	write(path?: string): any {
		path = path || this.configPath;
		const data = this.data();
		try {
			// make sure the folder exists as it
			// could have been deleted in the meantime
			mkdirp.sync(_path.dirname(path), defaultPathMode);
			writeFileAtomic.sync(path, JSON.stringify(data, null, 4), writeFileOptions);
		} catch (err) {
			// improve the message of permission errors
			if (err.code === 'EACCES') {
				err.message = err.message + '\n' + permissionError + '\n';
			}
			throw err;
		}
	}
}
