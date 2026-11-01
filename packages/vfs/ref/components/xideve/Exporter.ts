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

let io = {
	read: read,
	write: write
};
export interface IOptions {
	serverTemplates: string;
	linux32: boolean;
	linux64: boolean;
	osx: boolean;
	arm: boolean;
	windows: boolean;
	root: string;
	system: string;
	user: string;
	client: string;
	target: string;
	nodeServers: string;
	debug: boolean;
	deviceServerPort: number;
	mongo_port: number;
	mqtt_port: number;
	http_port: number;
	serverSide: true,
	updateDevice: true
}

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

function cleanUrl(str: string) {
	if (str) {
		str = str.replace('//', '/');
		str = str.replace('./', '/');
		return str;
	}
	return str;
}

/**
 * This class creates a stand-alone package of a "Control-Freak" created application.
 * Essentially it takes a bunch of paths and options and outputs a folder on disc.
 *
 *
 * @export
 * @class Exporter
 */
export default class Exporter {
	options: IOptions = null;
	profile: IObjectLiteral = null;
	delegate: any = null;
	constructor(args: any, delegate: IDelegate) {
		this.options = args.options;
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
		const options = this.options;
		console.log('run;', options);
		this.onProgress('Export Manager: begin export');
		if (!options.root) {
			this.onError('Export Manager: have no root');
			throw new Error('Export Manager: have no root');
		}

		if (!options.system) {
			this.onError('Export Manager: have no data');
			throw new Error('Export Manager: have no data');
		}

		if (!options.user) {
			this.onError('Export Manager: have no user');
			return;
		}
		options.serverSide = true;
		if (!options.client) {
            /*
            if (has('debug')) {
                this.client = xutils.resolve(this.root + '/dist/windows/Code/client/');
            } else {
                this.client = xutils.resolve(this.root + '/Code/client/');
            }
            */
		}
		try {
			if (!options.serverTemplates) {
				options.serverTemplates = resolve(options.root + '/server-template');
			}

			debugPaths && console.log('export with \n', {
				"System Data": options.system,
				"User Data": options.user + ' = ' + path.resolve(options.user),
				"Root": path.resolve(options.root),
				"Server-Templates": options.serverTemplates,
				"Target": path.resolve(options.target),
				"Node Servers": path.resolve(options.nodeServers),
				"Client": options.client,
				"Export Windows": options.windows,
				"Export Linux - 32 ": options.linux32,
				"Export Linux - 64 ": options.linux64,
				"Export OSX": options.osx,
				"Export ARM": options.arm
			});
		} catch (e) {
			console.error('Error export ', e);
		}
		const d = false;
		if (d) {
			return;
		}
		let all = true;
		if (all) {

			if (!options.deviceServerPort) {
				options.deviceServerPort = 9997;
			}
			if (!options.mongo_port) {
				options.mongo_port = 27018;
			}
			if (!options.mqtt_port) {
				options.mqtt_port = 1884;
			}

			if (!options.http_port) {
				options.http_port = 5556;
			}

			//this.exportMongo(options);
			this.createDirectoryLayout(options);
			this.exportServer(options);
			this.onProgress('Exported Servers');
			this.exportUser(options);
			this.onProgress('Exported User');
			this.exportSystem(options);
			this.onProgress('Exported System Data');
			this.exportMisc(options);
			this.onProgress('Exported Misc Data');
			this.onProgress('Exporting User Workspace HTML');
			this.exportHTML(options);
			this.onProgress('Exported User Workspace HTML');
			this.exportDevices(options);
			this.onProgress('Exported Devices');
			this.exportDrivers(options);
			this.onProgress('Exported Drivers');
			const forceDist: boolean = true;
			if (options.client) {
				this.exportClientEx(options);
			} else {
				if (!options.debug) {
					this.exportClient(options);
				} else {
					this.exportClientDist(options);
				}
			}
			this.onProgress('Exported Client Application Assets');
			console.log('Export Done! Your application can be found at ' + options.target);
			this.onProgress('Export Done');
			this.onFinish('Export Done! Your application can be found at ' + options.target);

		} else {
			this.exportHTML(options);
		}
	}
	exportHTML(options: IOptions) {
		try {
			let source = jet.dir(options.target + '/user/workspace/');
			let thiz = this;
			function parseDirectory(_path, name) {
				// name = directory abs
				let dirItems = fs.readdirSync(_path);
				if (dirItems.length) {
					_.each(dirItems, function (file) {
						// file = file name
						if (file.indexOf('.dhtml') !== -1) {
							let root = name.replace(source.path() + '/', '');
							thiz.exportHTMLFile2(_path + '/' + file, root, options);
						}
					});
				}
			}

			function _walk(dir) {
				let results = [];
				if (fs.existsSync(dir)) {
					let list = fs.readdirSync(dir);
					list.forEach(function (file) {
						file = dir + '/' + file;
						let stat = fs.statSync(file);
						if (stat) {
							let root = file.replace(path + '/', '');
							if (stat.isDirectory()) {
								parseDirectory(file, root);
							} else {
								if (file.indexOf('.dhtml') !== -1) {
									root = root.replace(dir + '/', '');
									thiz.exportHTMLFile2(file, root, options);
								}

							}
						} else {
							console.error('cant get stat for ' + file);
						}
					});
				} else {
					console.error('device path ' + dir + ' doesnt exists');
				}
				return results;
			}

			_walk(source.path());
		} catch (e) {
			console.error('Error exporting HTML', e);
		}
	}
	exportHTMLFile2(file, folder, options: IOptions) {
		let exportRoot = jet.dir(options.root + '/export/');
		let template = io.read(path.resolve(exportRoot.path() + '/app.template.html'));
		let path_parts = pathinfo(file, EPATH_PARTS.PATHINFO_ALL);

		const dirName = path.dirname(file);
		const fileName = path.basename(file);

		if (folder === fileName) {
			folder = "";
		}
		let templateVariables = {
			libRoot: '/Code/client/src/lib',
			lodashUrl: '/Code/client/src/lib/external/lodash.min.js',
			requireBaseUrl: "/Code/client/src/lib/xibm/ibm",
			jQueryUrl: "/Code/client/src/lib/external/jquery-1.9.1.min.js",
			data: "",
			user: "/user",
			css: './' + cleanUrl(fileName.replace('.dhtml', '.css')),
			theme: "bootstrap",
			blox_file: "./" + folder + '/' + fileName.replace('.dhtml', '.xblox'),
			scene_file: "./" + folder + '/' + fileName,
			mount: "workspace",
			"VFS_VARS": serialize({
				"user_drivers": './user/drivers',
				"system_drivers": './system/drivers'
			}, null, 2)
		};

		//console.log('export HTML' + folder + '/' + fileName);

		template = replace(template, null, templateVariables, {
			begin: '%',
			end: '%'
		});
		let content = io.read(file);
		content = content.replace('<viewHeaderTemplate/>', template);
		content = content.replace(/\burl\s*\(\s*["']?([^"'\r\n\)\(]+)["']?\s*\)/gi,
			function (matchstr, parens) {
				let parts = parens.split('://');
				let mount = parts[0];
				let path = parts[1];
				if (mount && path) {
					return "url('./" + path + "')";
				}
				return parens;
			}
		);

		let dom = cheerio.load(content);
		let extra = '\n<script type="text/javascript">';
		extra += '\n\tvar test = 0;';
		extra += '\n</script>';
		dom('HEAD').append(dom(extra));
		io.write(file.replace('.dhtml', '.html'), dom.html());
	}
	exportHTMLFile(options: IOptions) {
		let exportRoot = jet.dir(options.root + '/export/');
		let source = jet.dir(options.target + '/user/workspace/');
		let file = path.resolve(source.path() + '/ascene.dhtml');
		let template = io.read(path.resolve(exportRoot.path() + '/app.template.html'));
		let templateVariables = _.mixin({
			libRoot: '/Code/client/src/lib',
			lodashUrl: '/Code/client/src/lib/external/lodash.min.js',
			requireBaseUrl: "/Code/client/src/lib/xibm/ibm",
			jQueryUrl: "/Code/client/src/lib/external/jquery-1.9.1.min.js",
			data: "",
			user: "/user",
			css: "./ascene.css",
			theme: "bootstrap",
			blox_file: "./ascene.xblox",
			mount: "workspace",
			"VFS_VARS": serialize({
				"user_drivers": './user/drivers',
				"system_drivers": './system/drivers'
			}, null, 2)
		}, options as any);

		template = replace(template, null, templateVariables, {
			begin: '%',
			end: '%'
		});
		let content = io.read(file);
		content = content.replace('<viewHeaderTemplate/>', template);
		let did = false;
		content = content.replace(/\burl\s*\(\s*["']?([^"'\r\n\)\(]+)["']?\s*\)/gi,
			function (matchstr, parens) {
				let parts = parens.split('://');
				let mount = parts[0];
				let path = parts[1];
				if (mount && path) {
					did = true;
					return "url('./" + path + "')";
				}
				return parens;
			}
		);
		let dom = cheerio.load(content);
		let extra = '\n<script type="text/javascript">';
		extra += '\n\tvar test = 0;';
		extra += '\n</script>';
		dom('HEAD').append(dom(extra));
		io.write(file.replace('.dhtml', '.html'), dom.html());
	}
	
	async exportDevices(options: IOptions) {
		try {
			let userDevicesPath = path.resolve(options.target + '/user/devices');

			let devices = await getDevices(userDevicesPath, 'user_devices', options) as any[];
			io.write(userDevicesPath + '/user_devices.json', serialize({
				items: devices
			}, null, 2));

			devices.forEach(device => {
				if (device.user) {
					io.write(path.join(options.target, '/user/devices/' + device.path), serialize({
						inputs: device.user.inputs
					}, null, 2))
				}
			});

			let systemDevicesPath = path.resolve(options.target + '/data/system/devices');
			devices = await getDevices(systemDevicesPath, 'system_devices', options) as any[];

			devices.forEach(device => {
				if (device.user) {
					io.write(path.join(options.target, '/data/system/devices/' + device.path), serialize({
						inputs: device.user.inputs
					}, null, 2))
				}
			});

			io.write(systemDevicesPath + '/system_devices.json', serialize({
				items: devices
			}, null, 2));
		} catch (e) {
			console.error('error exporting devices:', e);
		}
	}
	exportDrivers(options: IOptions) {
		let userDriversPath = path.resolve(options.target + '/user/drivers');
		let drivers = getDrivers(userDriversPath, 'user_drivers');
		io.write(userDriversPath + '/user_drivers.json', serialize({
			items: drivers
		}, null, 2));

		let systemDriversPath = path.resolve(options.target + '/data/system/drivers');
		drivers = getDrivers(systemDriversPath, 'system_drivers');
		io.write(systemDriversPath + '/system_drivers.json', serialize({
			items: drivers
		}, null, 2));
	}

	exportMisc(options: IOptions) {
		let source = jet.dir(options.root + '/export');
		let target = jet.dir(options.target);
		jet.copy(source.path(), target.path(), {
			matching: [
				'**'
			],
			overwrite: true
		});

        /**
         * update config
         */
		let template = io.read(path.resolve(source.path() + '/profile_device_server.json'));
		let content = replace(template, null, options, {
			begin: '%',
			end: '%'
		});


		if (options.linux32) {
			jet.exists(target.path() +
				path.sep + '/server/linux_32/nxappmain/profile_device_server.json') && io.write(target.path() + path.sep +
					'/server/linux_32/nxappmain/profile_device_server.json', content);
		}

		if (options.linux64) {
			jet.exists(target.path() +
				path.sep + '/server/linux_64/nxappmain/profile_device_server.json') && io.write(target.path() + path.sep +
					'/server/linux_64/nxappmain/profile_device_server.json', content);
		}

		if (options.windows) {
			jet.exists(target.path() +
				path.sep + '/server/windows/nxappmain/profile_device_server.json') && io.write(target.path() + path.sep +
					'/server/windows/nxappmain/profile_device_server.json', content);
		}
		if (options.arm) {
			jet.exists(target.path() +
				path.sep + '/server/arm/nxappmain/profile_device_server.json') && io.write(target.path() + path.sep +
					'/server/arm/nxappmain/profile_device_server.json', content);
		}
		if (options.osx) {
			jet.exists(target.path() +
				path.sep + '/server/osx_64/nxappmain/profile_device_server.json') && io.write(target.path() + path.sep + '/server/osx_64/nxappmain/profile_device_server.json', content);
		}

        /**
         * update boot start.js
         */
		template = io.read(path.resolve(source.path() + '/start.js'));
		content = replace(template, null, options, {
			begin: '%',
			end: '%'
		});

		options.linux32 !== false && jet.exists(target.path() + '/server/linux_32/start.js') && io.write(target.path() + '/server/linux_32/start.js', content);
		options.linux64 !== false && jet.exists(target.path() + '/server/linux_64/start.js') && io.write(target.path() + '/server/linux_64/start.js', content);
		options.windows !== false && io.write(target.path() + '/server/windows/start.js', content);
		options.arm !== false && jet.exists(target.path() + '/server/arm/start.js') && io.write(target.path() + '/server/arm/start.js', content);
		options.osx !== false && jet.exists(target.path() + '/server/osx_64/start.js') && io.write(target.path() + '/server/osx_64/start.js', content);
	}
	exportClientEx(options: IOptions) {
		let source = jet.dir(path.resolve(options.client) + '');
		let target = jet.dir(options.target + '/Code/client');
		jet.copy(source.path(), target.path(), {
			matching: [
				'**'
			],
			overwrite: true
		});
	}
	exportClient(options: IOptions) {
		let source = jet.dir(options.root + '/Code/client');
		let target = jet.dir(options.target + '/Code/client');
		jet.copy(source.path(), target.path(), {
			matching: [
				'**'
			],
			overwrite: true
		});
	}
	exportClientDist(options: IOptions) {
		let source = jet.dir(options.root + '/dist/windows/Code/client/');
		let target = jet.dir(options.target + '/Code/client');

		jet.copy(source.path(), target.path(), {
			matching: [
				'**'
			],
			overwrite: true
		});
	}
	exportUser(options: IOptions) {
		let source = jet.dir(options.user);
		let target = jet.dir(options.target + '/user');
		console.log('export user from ' + source.path() + ' to ' + target.path());
		try {
			jet.copy(source.path(), target.path(), {
				matching: [
					'**',
					'!./.git/**/*',
					'!**/**claycenter',
					'!./claycenter',
					'!**claycenter'

				],
				overwrite: true
			});
		} catch (err) {
			if (err.code === 'EEXIST') {
				console.error('Error copying, file exists!', err);
			}

			if (err.code === 'EACCES') {
				console.error('Error copying, file access perrmissions!', err);
			}
			console.error('error : ', err);
		}
	}
	exportSystem(options: IOptions) {
		let source = jet.dir(options.system + '/system');
		let target = jet.dir(options.target + '/data/system');
		console.log('export system data from ' + source.path() + ' to ' + target.path());
		jet.copy(source.path(), target.path(), {
			matching: [
				'**'
			],
			overwrite: true
		});
	}
	clean() {
		// let dir = 'leveldown';
		// let files = ['*.lib', '*.pdb'];
	}
	copyServer(options: IOptions, platform: string) {
		let target = jet.dir(options.target + '/server/' + platform);
		let isDebug = false;
		let source: any = "";
		if (options.nodeServers) {
			if (!jet.exists(options.nodeServers + '/' + platform)) {
				return;
			}
			source = jet.dir(options.nodeServers + '/' + platform);
		} else {
			if (!isDebug) {
				source = jet.dir(options.root + '/server/' + platform);
			} else {
				source = jet.dir(options.root + '/server/nodejs/dist/' + platform);
			}
		}

		if (!jet.exists(source.path())) {
			return;
		}
		console.info('export Device-Server ' + platform + ' from : ' + source.path());
		try {

			jet.copy(source.path(), target.path(), {
				matching: [
					'**'
				],
				overwrite: true
			});
		} catch (err) {
			if (err.code === 'EEXIST') {
				console.error('Error copying, file exists!', err);
			}
			if (err.code === 'EACCES') {
				console.error('Error copying, file access perrmissions!', err);
			}
		}
	}
	exportServer(options: IOptions) {
		options.windows !== false && this.copyServer(options, 'windows');
		options.linux32 !== false && this.copyServer(options, 'linux_32');
		options.linux64 !== false && this.copyServer(options, 'linux_64');
		options.arm !== false && this.copyServer(options, 'arm');
		options.osx !== false && this.copyServer(options, 'osx_64');
	}
    /**
     * Create the default directory layout
     */
	createDirectoryLayout(options: IOptions) {
		//jet.dir(options.target + '/www/');
	}
    /**
     *
     * @param options
     */
	exportMongo(options: IOptions) {
		let source = jet.dir(options.serverTemplates + '/mongo');
		let target = jet.dir(options.target + '/mongo');
		jet.copy(source.path(), target.path(), {
			matching: [
				'mongod-arm',
				'mongod-linux_32',
				'mongod-linux_64',
				'mongod-windows.exe',
				'mongod-32.exe',
				'mongod-osx'
			],
			overwrite: true
		});
	}
}
