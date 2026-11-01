const parse = require('../index').parseText;
const path = require('path')
const read = require('@plastichub/fs/read').sync;

const template_ = read(`test.html`);
let vars = {
	name: '{{test}}',
	test: '{{other}}',
	other: 'alice',
	show: true,
	items: ['first', 'second'],
	objects: [{
		att: 'first att'
	}, {
		att: 'second att'
	}],
	recurse_test: false,
	number: 5,
	globals: {
		test: 1
	}
};

parse(template_, vars, 5, {
	root: [
		path.resolve('./')
	],
	toHTML: true
}).then(console.log);
