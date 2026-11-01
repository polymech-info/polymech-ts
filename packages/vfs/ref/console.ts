const tracer = require('tracer');
const util = require('util');
import * as global from './global';

let console = tracer.colorConsole({
	format: "<{{title}}> {{message}} ",
	dateformat: "HH:MM:ss.L"
});

if (typeof global['logError'] === 'undefined') {
	global['logError'] = function (e, reason) {
		console.error('Error ' + reason, e);
	};
}

export function stack() {
	let stack = new Error().stack;
	console.log(stack);
};
console.clear = function () {
	util.print("\u001b[2J\u001b[0;0H");
};

export { console as console };
