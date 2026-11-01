#!/usr/bin/env node
import { defaults } from './_cli.js'; defaults()
import { cli } from './cli.js'
import { register as registerBazarDownload } from './commands/bazar/downloadBazar.js'
registerBazarDownload(cli)

const argv: any = cli.argv;

if (argv.h || argv.help) {
    cli.showHelp();
    process.exit();
} else if (argv.v || argv.version) {
    process.exit();
}
