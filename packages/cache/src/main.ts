#!/usr/bin/env node
import { defaults } from './_cli.js'; defaults()
import * as cli from 'yargs'

import { register as registerInfo } from './commands/info.js'; registerInfo(cli)
import { register as registerTest } from './commands/test.js'; registerTest(cli)

const argv: any = cli.argv;

if (argv.help) {
    cli.showHelp();
    process.exit();
} else if (argv.v || argv.version) {
    process.exit();
}
