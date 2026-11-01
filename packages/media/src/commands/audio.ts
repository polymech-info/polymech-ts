import * as CLI from 'yargs'
import { logger } from '../index.js'
import { convert } from '../lib/media/audio/convert.js'
import { cli } from '../main.js'
import { defaults, sanitizeVideo } from '../_cli.js'
import { IConvertVideoOptions } from '../types.js'

export const defaultOptions = (yargs) => {
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

cli.command('video <verb>', 'Convert video', defaultOptions, async (argv) => {
    defaults()
    const options = sanitizeVideo(argv) as IConvertVideoOptions
    logger.info("options " + argv.dst, options)
    if (options.verb == 'convert') {
        return convert(options)
    }
})
