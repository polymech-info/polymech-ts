import * as CLI from 'yargs'
import { logger } from '../index.js'
import { cli } from '../cli.js'
import {
    sanitize,
    defaults
} from '../_cli.js'
import { toYargs } from '@polymech/commons'

import {
    watermark,
    WatermarkOptions,
    WatermarkOptionsSchema
} from '../lib/media/images/watermark.js'

export const command = 'watermark';
export const desc = 'Adds watermarks to images';

export const defaultOptions = (yargs: CLI.Argv) => {
    return toYargs(yargs, WatermarkOptionsSchema(), {
        onKey: ((yargs, key, options) => {
            switch (key) {
                case 'src':
                    return yargs.positional(key, {...options, demandOption: true})
                case 'watermark':
                    return yargs.option(key, {...options, demandOption: true})
                default:
                    return yargs.option(key, options)
            }
        })
    })
}
export const builder = defaultOptions
export async function handler(argv: CLI.Arguments) {
    defaults()
    const options = WatermarkOptionsSchema().parse(argv) as WatermarkOptions
    logger.settings.minLevel = options.logLevel as any
    
    // The watermark content is already parsed by the schema
    const sanitizedOptions = sanitize(options) as WatermarkOptions
    
    return await watermark(sanitizedOptions)
}

cli.command(command, desc, builder, handler)