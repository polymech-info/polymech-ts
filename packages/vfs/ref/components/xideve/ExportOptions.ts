import { IObjectLiteral } from '../../interfaces/index';
import { read, write } from '../../io/file';
import { serialize } from '../../io/json';
import { getDevices } from '../../services/Devices';
import { getDrivers } from '../../services/Drivers';
import { pathinfo, EPATH_PARTS } from '../../utils/FileUtils';
import { replace } from '../../utils/StringUtils';
import { console } from '../../console';
import * as _ from 'lodash';
//import * as views from 'co-views';
import * as path from 'path';
const fs = require('fs');
const util = require('util');
const jet = require('fs-jetpack');
const cheerio = require('cheerio');
const debugPaths: boolean = false;

export interface IDelegate {
	data: any;
	clear();
	onProgress(progress, data);
	onFinish(finish, data);
	onError(error, data);
};

function resolve(_path: string): string | null {
	let here = path.resolve(_path);
	try {
		if (fs.statSync(here)) {
			return here;
		}
	} catch (e) {
		return here;
	}

	try {
		if (fs.statSync(_path)) {
			return _path;
		} else {
			const test = process.cwd() + path.sep + _path;
			if (fs.statSync(test)) {
				return test;
			}
		}
	} catch (e) {
	}
	return null;
}
export default class ExportOptions {
	delegate: any = null;
	constructor(args: any, delegate: IDelegate) {
		this.delegate = delegate;
	}
    /**
     * @member {string|null} serverTemplates the path to the server templates. Defaults to
     *  this.root + 'server-template'
     */
	onProgress(msg: string) {
		this.delegate && this.delegate.onProgress(msg);
		console.log('Progress:  ' + msg);
	}
	onError(msg: string) {
		console.error('error export ', msg);
		this.delegate && this.delegate.onError(msg);
	}
	onFinish(msg: string): void {
		this.delegate && this.delegate.onFinish(msg);
		console.log('Finish:  ' + msg);
	}
    /**
     * @param options {module:nxapp/model/ExportOptions}
     */
	run() {
		
	}	
}
