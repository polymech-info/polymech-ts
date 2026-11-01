import { Options, ELayout } from './applications/Base';
import { ControlFreak } from './applications/ControlFreak/index';
import { xbox } from './applications/xbox/index';
import { EPersistence } from './interfaces/Application';
import * as path from 'path';
import * as yargs_parser from 'yargs-parser';
const homedir = require('os-homedir');
let argv = yargs_parser(process.argv.slice(2));
let app = argv.app ? yargs_parser.app : "ControlFreak";
let root = argv.root ? path.resolve(argv.root) : path.resolve('../../../');
if (argv.nodejs && !argv.root) {
	root = path.resolve(path.join(__dirname, '..'));
	process.chdir(root);
}
if (argv.file) {
	/*
	if (commander.file) {
		var file = path.resolve(commander.file);
		if (fs.existsSync(file)) {
			var context = new vm.createContext({
				require: require.nodeRequire,
				commander: commander,
				console: console,
				process: process,
				setTimeout: setTimeout,
				global: global
			});
			var content = FileUtils.readFile(file);
			var script = new vm.Script(content);
			script.runInContext(context);
			return;
		} else {
			console.error('file specified but doesnt exists ' + commander.file);
		}
	}
	*/
}
let user: string = null;
if (!argv.user && argv.home === 'true') {
	user = path.join(homedir(), 'Documents', 'Control-Freak');
}
const CFOptions: Options = {
	root: root,
	port: argv.port,
	release: argv.release === 'true',
	clientRoot: argv.clientRoot,
	type: argv.type || ELayout.SOURCE,
	print: argv.print === 'true',
	uuid: argv.uuid || 'ide',
	user: user || (argv.user ? path.resolve(argv.user) : null),
	persistence: argv.persistences ? argv.persistence : EPersistence.MEMORY,
	interface: argv.interface ? argv.interface : null,
	home: argv.home === 'true'
};
export function create(app: string) {
	let application;
	switch (app) {
		case "ControlFreak": {
			application = new ControlFreak(CFOptions);
			application.run(true).then((deviceServerContext) => {
				/*
					var Server = require('socket.io');
					var io = new Server(9998);
					io.attach(cf);
					io.on( 'connection', sock => {
						console.log('connection:',sock);
					})
				*/

				/*var wsio = require('websocket.io')
					, wamp = require('wamp.io-mirror');

				var ws = wsio.listen(9000);
				var app = wamp.attach(ws);

				app.on('call', function (procUri, args, cb) {
					if (procUri === 'isEven') {
						cb(null, args[0] % 2 == 0);
					}
				});

				const Wampy = require('wampy');
				//const wampyCra = require('wampy-cra');
				const w3cws = require('websocket').w3cwebsocket;

				console.log('w', Wampy);

				try {
					var b = new Wampy('ws://localhost:9000', {
						//ws: w3cws,
						//realm: 'realm1',
						//authid: 'joe',
						//authmethods: ['wampcra'],
						onChallenge: (method, info) => {
							console.log('Requested challenge with ', method, info);
							//return wampyCra.sign('joe secret key or password', info.challenge);
						},
						onConnect: () => {
							console.log('Connected to Router!');
						}
					});
				} catch (e) {
					console.error('error', e);
				}
				*/

				/*

					let deviceServer = deviceServerContext.getDeviceServer();
					//console.log('device server : ', deviceServer.socket);
					for (let p in deviceServer.socket) {
						//typeof deviceServer.socket[p] !=='function' && console.log('p ' + p , deviceServer.socket[p]);
					}

					const options: OptionsInterface = {
						port: 8000,
						realms: ['com.example.inge']
						//ws: deviceServer.socket
					};
				const SERVER = new Server(options);*/
			});
			break;
		}
		case "xbox": {
			application = new xbox(CFOptions);
			application.run(true).then(() => { });
			break;
		}
		default: {
			console.error('cant find application ' + app);
		}
	}

	return application;
}
create(argv.app || 'ControlFreak');
