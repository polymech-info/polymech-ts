import * as CLI from 'yargs'
import { logger } from '../index.js'
import { convert, merge } from '../lib/media/video/index.js'
import { defaults, sanitizeVideo } from '../_cli.js'
import { IConvertVideoOptions } from '../types.js'

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
    })
}

let options = (yargs: CLI.Argv) => defaultOptions(yargs)

export const register = (cli: CLI.Argv) => {
    return cli.command('video <verb>', 'Convert video', options, async (argv: CLI.Arguments) => {
        defaults()
        const options = sanitizeVideo(argv) as IConvertVideoOptions
        logger.info("options " + argv.dst, options)
        if (options.verb == 'convert') {
            return convert(options)
        }
        if (options.verb == 'merge') {
            return merge(options) as any
        }
    })
}
