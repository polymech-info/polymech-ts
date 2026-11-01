import * as CLI from 'yargs'
import * as path from 'path'
import { substitute } from '@polymech/core/strings'

import { CONFIG_DEFAULT, DEFAULT_ROOTS } from '@polymech/commons'

import { logger } from '../index.js'
import { defaults } from '../_cli.js'

const defaultOptions = (yargs: CLI.Argv) => {
    return yargs.option('debug', {
        default: 'false',
        describe: 'debug messages'
    }).option('env_key', {
        default: 'OSR-CONFIG',
        describe: 'Environment key to the config path'
    })
}
let options = (yargs: CLI.Argv) => defaultOptions(yargs)
export const register = (cli: CLI.Argv) => {
    return cli.command('user', 'User commands, call with <verb>', options, async (argv: CLI.Arguments) => {
        defaults()
        if (argv.help) { return }
        const args: any = argv
        const config = CONFIG_DEFAULT(args.env_key)
        const opts = {
            verb: argv.verb,
            src: path.resolve(substitute(args.src, DEFAULT_ROOTS)),
            dst: path.resolve(args.dst)
        }
        logger.debug(`Reading OSR Config with key "${argv.env_key}"`, opts)

    })
}
