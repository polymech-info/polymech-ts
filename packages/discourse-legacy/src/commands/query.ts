import * as CLI from 'yargs'

import { defaults, sanitize } from '../_cli'
import { parse } from '../options'
import { IOptions } from '../types'
import { logger } from '../index'

import { Instance } from '../lib/discourse'

const defaultOptions = (yargs: CLI.Argv) => {
    return yargs.option('debug', {
        default: false,
        describe: 'debug messages',
        type: 'boolean'
    }).option('short', {
        default: 'true',
        describe: 'Emit short info only',
        type: 'boolean'
    }).option('disabled', {
        default: 'false',
        describe: 'Enumerate disabled products',
        type: 'boolean'
    }).option('dry', {
        default: 'false',
        describe: 'Process files for debug purposes only.'
    }).option('env_key', {
        default: 'OSR-CONFIG',
        describe: 'Environment key to the config path.'
    })
}

let options = (yargs: CLI.Argv) => defaultOptions(yargs)

export const register = (cli: CLI.Argv) => {
    return cli.command('query <verb>', 'Search namespace', options, async (argv: CLI.Arguments) => {
        defaults();
        if (argv.help) { return }
        const args: any = argv
        
        let options = sanitize(argv as any) as IOptions

        if (!options) {
            return
        }
        options.debug && logger.debug(`CLI Args In`, argv)
        let opts = parse(options, args)

        if (!opts.verb) {
            logger.error('No verb specified')
            return;
        }
        const discourse = Instance()
        if (opts.verb == 'tags') {
            const items = await discourse.search('Sheetpress - Cell','tags:sheetpress');
            logger.info('items',items)
        }
        return
    })
}
