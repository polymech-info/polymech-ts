#!/usr/bin/env node
import { defaults } from './_cli.js'; defaults()
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

//import { register as registerTest } from './commands/test'; registerTest(CLI)

const parser = yargs(hideBin(process.argv));
const argv: any = parser.argv
if (argv.h || argv.help) {
    parser.showHelp();
    process.exit();
} else if (argv.v || argv.version) {
    process.exit();
}
