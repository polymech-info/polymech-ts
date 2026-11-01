const path = require('path')
const read = require('@plastichub/fs/read').sync;
// const template = read(path.resolve(`./google-sheet-source.md`));

const template = read(path.resolve(`./test-js.html`)); 
const engine = require('../Engine').Engine;
const Engine = new engine({
	root: [process.cwd()],
	toHTML: false,
	keepOutputType: true,
	trimTagRight: false,
	trimTagLeft: false,
	trimOutputRight: false,
	trimOutputLeft: false,
	// language: 'liquid',
	language:'osr'
});

Engine.parse(template, {
	someVariable: 'test',
	ROOT: process.cwd(),
	someNumber:2
}, 0).then(console.log);
