#!/usr/bin/env node
import { defaults } from './_cli'; defaults()

import * as cli from 'yargs'
import { register as registerInfo } from './commands/info'; registerInfo(cli)

const argv = cli.argv;

if (argv.h || argv.help) {
    cli.showHelp();
    process.exit();
} else if (argv.v || argv.version) {
    // tslint:disable-next-line:no-var-requires
    process.exit();
}

