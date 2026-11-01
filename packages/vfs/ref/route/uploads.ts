import { ApplicationBase } from '../applications/Base';
import { DirectoryService } from '../services/Directory';
import * as busboy from 'async-busboy';
import * as fs from 'fs';
import * as Router from 'koa-router';
import * as path from 'path';
import * as qs from 'qs';
import * as bodyParser from 'koa-bodyparser';
export class UploadRouter extends Router {
	constructor(args: any) {
		super(args);
	}
	public directoryService: DirectoryService;
}
export function create(directoryService: DirectoryService, prefix: string = '/upload', app: ApplicationBase): UploadRouter {
	const filesRouter = new UploadRouter({ prefix: prefix });
	filesRouter.directoryService = directoryService;
	filesRouter.post('/*', async (ctx, next) => {
		const params = qs.parse(ctx.request.querystring);
		const mount = params.mount;
		const dstDir = params.dstDir;
		if (!mount || !dstDir) {
			return next();
		}
		// @TODO: files router doesnt catch right
		if (!ctx.req.url.startsWith(prefix)) {
			return next();
		}
		const params2 = ctx.params;

		const data = await busboy(ctx.req);
		const files = data.files;
		files.forEach((file) => {
			file.pipe(fs.createWriteStream(filesRouter.directoryService.resolve(mount, dstDir + path.sep + file.filename)));
		});
		ctx.body = '{"jsonrpc":"2.0","result":[],"id":0}';
		ctx.status = 200;
	});
	return filesRouter;
}
