#!/usr/bin/env node
import * as cli from 'yargs';
const argv = cli.argv;
if (argv.h || argv.help) {
    cli.showHelp();
    process.exit();
}
else if (argv.v || argv.version) {
    process.exit();
}
