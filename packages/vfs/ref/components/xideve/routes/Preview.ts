import { EEKey, ELayout } from '../../../applications/Base';
import { ControlFreak as app } from '../../../applications/ControlFreak/index';
import { IObjectLiteral } from '../../../interfaces/index';
import { serialize } from '../../../io/json';
import * as views from 'co-views';
import * as Router from 'koa-router';
import * as _ from 'lodash';
import * as path from 'path';
import * as fs from 'fs';
import { serveIndex } from '../../../server/index';
const PreviewRouter = new Router({ prefix: '/xideve' });
PreviewRouter.get('/:preview/:mount/*', async (ctx: Router.IRouterContext, next: any) => {

	let render = null;
	const rtConfig = ctx.request.query.debug === 'true' ? 'debug' : 'release';
	const mount = ctx.params.mount;
	const filePath = ctx.params[0].replace('./', '/');
	const app: app = (<app>ctx.app);
	const directoryService = app.directoryService;
	const workspacePath = directoryService.resolve(mount, '', ctx.request);
	let stat;
	try {
		stat = fs.statSync(path.join(workspacePath, filePath));
	} catch (err) {
	}

	if (!filePath || stat.isDirectory()) {
		return serveIndex(workspacePath, {
			remove: '/xideve/preview/' + mount + '/',
			icons: true,
			view: 'details'
		})(ctx, next);
	}
	const dir = path.dirname(filePath).replace('.', '');
	if (app.options.type === ELayout.OFFLINE_RELEASE) {
		render = views(path.join(app.path(EEKey.NODE_ROOT), '/_build/components/xideve/views'), { ext: 'ejs' });
	} else {
		render = views(path.join(__dirname, '../views'), { ext: 'ejs' });
	}
	const config = (<IObjectLiteral>app)['config'];
	const variables = _.extend({}, config.relativeVariables);
	app.variables(ctx, variables);
	const tplParams = {
		BASE_URL: variables[EEKey.BASE_URL],
		APP_URL: variables[EEKey.APP_URL],
		MOUNT: mount,
		FILE: filePath,
		THEME: 'bootstrap',
		ROOT: variables[EEKey.ROOT],
		RPC_URL: variables[EEKey.RPC_URL],
		VFS_URL: variables[EEKey.VFS_URL],
		VFS_VARS: serialize(variables['VFS_CONFIG'], null, 2),
		CSS: variables[EEKey.VFS_URL] + mount + '/' + filePath.replace('.dhtml', '.css'),
		DOC_BASE_URL: variables[EEKey.VFS_URL] + mount + '/' + dir,
		USER_DIRECTORY: encodeURIComponent(app.directoryService._getUser(ctx.request) || variables['VFS_CONFIG'].user)
	};
	let templateResolved = null;
	let content = null;
	let error = null;
	try {
		templateResolved = await render(rtConfig, tplParams);
	} catch (e) {
		error = 'Error rendering EJS template for ' + mount + '://' + filePath;
		ctx.body = error;
		console.error(error, e);
	}

	try {
		content = await app.directoryService.get(mount + '://' + filePath, false, false, null, ctx.request) as string;
	} catch (e) {
		error = 'cant get file ' + mount + '://' + filePath;
		ctx.body = error;
		return;
	}
	// fileContent.match(~\bbackground(-image)?\s*:(.*?)\(\s*('|")?(?<image>.*?)\3?\s*\)~i);
	content = content.replace(/\burl\s*\(\s*["']?([^"'\r\n\)\(]+)["']?\s*\)/gi,
		function (matchstr, parens) {
			let parts = parens.split('://');
			let mount = parts[0];
			let _path = parts[1];
			if (mount && _path) {
				_path = variables[EEKey.VFS_URL] + mount + '/' + _path;
				return "url('" + _path + "')";
			}
			return parens;
		}
	);

	const result = content.replace('<viewHeaderTemplate/>', templateResolved);
	ctx.body = result;
});
export default PreviewRouter;
