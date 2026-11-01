import { Component } from '../Component';
import { BaseService } from '../../services/Base';
import { ApplicationBase } from '../../applications/Base';
import { IServiceConfiguration } from '../../interfaces/Service';
import * as Router from 'koa-router';

import { IConflictSettings, ICopyOptions, ItemProgressCallback, INode, ECopyFlags } from '../../fs/interfaces';
import { IOptions as IMatcherOptions } from '../../fs/utils/matcher';
import { DirectoryService } from '../../services/Directory';

import { async as copyAsync } from '../../fs/copy';
import * as path from 'path';
import { createUUID } from '../../utils/StringUtils';
import { IObjectLiteral } from '../../interfaces/index';
import { containsPath } from '../../vfs/utils';
let pathToRegexp = require('path-to-regexp');


interface Options {
	id: string;
	client: any;
	delegate: any;
}

export class XFILE extends Component {
	options: Options;
	abort: boolean = false;
	running: Promise<void>;
	constructor(application: ApplicationBase, serviceConfig: IServiceConfiguration, options: any) {
		super(application, serviceConfig);
		this.options = options;
	}
	label(): string {
		return "xfile";
	}
	services(config: IServiceConfiguration): BaseService[] {
		return [];
	}
	routes(): Router[] {
		return [];
	}
	cancel() {
		this.abort = true;
	}
	waiting: IObjectLiteral = {};
	answer(data: any) {
		const waiting = this.waiting[data.iid];
		if (waiting) {
			waiting['resolve'](data.answer);
			delete this.waiting[data.iid];
		}
	}
	_cp(src: string, dst: string) {

	}

	cp(src: string, dst: string) {

		const directoryService: DirectoryService = this.application['directoryService'];
		// console.log('dir', directoryService);

		const selection = ['workspace_user/ClayCenter/init.css'];
		const srcMount = directoryService.resolveShort(selection[0]).mount;
		const srcVFS = directoryService.getVFS(srcMount);
		const root = directoryService.resolvePath(srcMount, '');
		const checkFilesInRoot = (dirService: DirectoryService, srcMount: string, selection: string[]) => {
			let result = true;
			selection.forEach((item: string) => {
				const rel = dirService.resolveShort(item).path;
				const abs = dirService.resolvePath(srcMount, rel);
				if (!containsPath(abs, rel)) {
					result = false;
				}
			});
			return result;
		};
		const relatives = (dirService: DirectoryService, selection: string[]) => {
			return selection.map((item: string) => {
				return dirService.resolveShort(item).path;
			});
		};

		const absolutes = (dirService: DirectoryService, selection: string[]) => {
			return selection.map((item: string) => {
				const rel = dirService.resolveShort(item).path;
				const abs = dirService.resolvePath(srcMount, rel);
				return abs;
			});
		};

		// console.log('contains : ', checkFilesInRoot(directoryService, srcMount, ['workspace_user/A-VLC.css']));

		// const _matcher = matcher('', relatives(directoryService, selection), matcherOptions);

		// console.log('as regex : ', pathToRegexp('./ClayCenter/init.css'));
		// console.log('as regex : ', pathToRegexp('ClayCenter/init.css'));

		// console.log('rels : ', relatives(directoryService, selection));

		// console.log('matcher ', _matcher('**/ClayCenter/init.css'));
		// console.log('matcher 2 ', _matcher('./ClayCenter/init.css'));
		// console.log('matcher 3 ', _matcher('**/*/init.css'));
		// console.log('matcher 4 ', _matcher('./**/*/*.css'));
		// console.log('matcher 5 ', _matcher('**/*.css'));
		// console.log('matcher 6 ', _matcher('ClayCenter/init.css'));

		// const _matcherAbs = matcher(root + '/', absolutes(directoryService, selection), matcherOptions);
		// console.log('abs : ' + root, absolutes(directoryService, selection));
		// console.log('matcher abs ', _matcherAbs('**/ClayCenter/init.css'));
		// console.log('matcher abs 2 ', _matcherAbs('./ClayCenter/init.css'));
		// console.log('matcher abs 3 ', _matcherAbs('**/*/*.css'));
		// console.log('matcher abs 4 ', _matcherAbs('/PMaster/projects/x4mm/user/workspace/ClayCenter/init.css'));

		// console.log('matcher abs 4 ', _matcherAbs('/PMaster/projects/x4mm/user/workspace/ClayCenter/init.css'));


		let c = 0;
		let done: any[] = [];
		let delegate = this.options.delegate;
		let self = this;

		const progress: ItemProgressCallback = function (path: string, current: number, total: number, item?: INode) {
			done.push({ item: item, path: path });
			c++;
			if (c >= 1) {
				delegate.onProgress(done);
				done = [];
				c = 0;
			}
			return !self.abort;
		};

		const conflictCallback = function (path: string, item: INode, err: string): Promise<IConflictSettings> {
			const iid: string = createUUID();
			self.waiting[iid] = {};
			const promise = new Promise<IConflictSettings>((resolve, reject) => {
				delegate.onInterrupt({
					path: path,
					error: err,
					iid: iid,
					item: item
				});
				self.waiting[iid].resolve = resolve;
			});

			self.waiting[iid].promise = promise;
			return promise;
		};

		let options: ICopyOptions = {
			progress: progress,
			conflictCallback: conflictCallback,
			// overwrite: true,
			matching: ['**/*.ts'],
			debug: false,
			flags: ECopyFlags.FOLLOW_SYMLINKS | ECopyFlags.REPORT,
			writeProgress: (path: string, current: number, total: number) => {
				delegate.onProgress([
					{
						path: path,
						current: current,
						total: total
					}
				]);
			}
		};

		src = path.resolve('./src/fs/');
		dst = '/tmp/node_modules_fs/';

		this.running = copyAsync(src, dst, options).then(function (res) {
			console.log('done', res);
			delegate.onFinish({});
		}).catch(function (e) {
			console.error('error copyAsync', e);
		});
	}
};

//
// ─── flow ───────────────────────────────────────────────────────────────────────
//
// 	client:
// 		runAppServerComponentMethod(component,method,args)
// 	server:
//  	runComponentMethod(component,method,args)
//  component:
//      method(...,delegate)
