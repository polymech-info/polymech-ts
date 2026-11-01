#!/usr/bin/env node
import { defaults } from './_cli'; defaults()
import * as CLI from 'yargs'
import { register as registerCompile } from './commands/compile'; registerCompile(CLI)
import { register as registerInit } from './commands/init'; registerInit(CLI)
import { types } from './zod_schema'

const defaultOptions = (yargs: CLI.Argv) => {
    return yargs.option('logLevel', {
        default: 'info',
        describe: 'Log level : error, warn, info, debug, trace'
    })
}

let options = (yargs: CLI.Argv) => defaultOptions(yargs)

export const register = (cli: CLI.Argv) => {
    return cli.command('types', 'generate types', options , async (argv: CLI.Arguments) => {
        if (argv.help) { return }
        types()
    })
}
register(CLI)

const argv: any = CLI.argv

if (argv.h || argv.help) {
    CLI.showHelp();
    process.exit();
} else if (argv.v || argv.version) {
    process.exit();
}
