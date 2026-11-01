import * as CLI from 'yargs'
import { logger } from '../index.js'

import {
    convert
} from '../lib/media/images/index.js'

import {
    sanitize,
    defaults,
    sanitizeVideo
} from '../_cli.js'

import {
    IOptions
} from '../types.js'


export const defaultOptions = (yargs: CLI.Argv) => {
    return yargs.option('src', {
        describe: 'FILE|FOLDER|GLOB',
        demandOption: true
    }).option('dst', {
        describe: 'FILE|FOLDER|GLOB'
    }).option('debug', {
        default: false,
        describe: 'Enable internal debug messages',
        type: 'boolean'
    }).option('alt', {
        default: false,
        describe: 'Use alternate tokenizer, & instead of $',
        type: 'boolean'
    }).option('dry', {
        default: false,
        describe: 'Run without conversion',
        type: 'boolean'
    }).option('verbose', {
        default: false,
        describe: 'Show internal messages',
        type: 'boolean'
    })
}

let options = (yargs: CLI.Argv) => defaultOptions(yargs)

export const register = (cli: CLI.Argv) => {
    return cli.command('convert', 'Convert files', options, (argv: CLI.Arguments) => {
        defaults()
        const options = sanitizeVideo(argv) as IOptions
        options.debug && logger.info("options " + argv.dst, options)
        return convert(options)
    })
}
