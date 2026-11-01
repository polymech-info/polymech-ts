const Liquid = require('liquidjs');
const engine = new Liquid.Liquid();
const path = require('path')
const read = require('@plastichub/fs/read').sync;

const template = path.resolve(`./test-js.html`);

const template_ = read(template);

console.log('template',template_);
debugger;

const scope = {
	test: '{{other}}',
	other: 'other'
};

let parse = engine.parse(template_);

const rendered = engine.render(parse, scope, {}, true).then(console.log);

// console.log('t',tags);

try {

} catch (e) {
	console.error(e);
}
