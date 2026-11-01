import * as CLI from 'yargs'
import { logger } from '../index'
import {
    resize
} from '../lib/media/images/resize'

import {
    sanitize,
    defaults
} from '../_cli'

import {
    IOptions
} from '../types'

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
    }).option('percent', {
        default: false,
        describe: 'Resize image with percent',
        type: 'number'
    }).option('width', {
        default: false,
        describe: 'Resize image with',
        type: 'number'
    }).option('height', {
        default: false,
        describe: 'Resize image height',
        type: 'number'
    }).option('minHeight', {
        describe: 'Resize image minimum height',
        type: 'number'
    }).option('minWidth', {
        describe: 'Resize image minimum width',
        type: 'number'
    }).option('minSize', {
        describe: 'Resize image size (bytes)',
        type: 'number'
    }).option('percent', {
        describe: 'Resize image in percent (width)',
        type: 'number'
    }).option('logLevel', {
        describe: 'Log level : warn, info, debug, error',
        type: 'string',
        default: 'info'
    })
}

let options = (yargs: CLI.Argv) => defaultOptions(yargs)

export const register = (cli: CLI.Argv) => {
    return cli.command('thumbails', 'Create Thumbnail files', options, async (argv: CLI.Arguments) => {
        defaults()
        const options = sanitize(argv) as IOptions
        logger.setSettings({
            minLevel: options.logLevel as any
        })
        logger.info("options " + argv.dst, options)
        await resize(options)
    })
}
