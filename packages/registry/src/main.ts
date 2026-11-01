#!/usr/bin/env node
import { defaults } from './_cli.js'; defaults()
import { cli } from './cli.js'

import { register as registerInfo } from './commands/info.js'; registerInfo(cli)

const argv: any = cli.argv;

if (argv.help) {
    cli.showHelp();
    process.exit();
} else if (argv.v || argv.version) {
    process.exit();
}
