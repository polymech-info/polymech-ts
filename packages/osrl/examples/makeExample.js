const path = require('path')
const read = require('@plastichub/fs/read').sync;

const argv = require('yargs-parser')(process.argv.slice(2))

const template = path.parse(argv.template);
const runner = path.parse(argv.runner);
const output = path.parse(argv.output);
