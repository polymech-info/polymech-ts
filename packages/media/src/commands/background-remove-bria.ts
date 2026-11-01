import * as CLI from 'yargs'
import { CONFIG_DEFAULT } from '@polymech/commons'
import { logger } from '../index.js'
import { cli } from '../cli.js'
import {
    sanitize,
    defaults
} from '../_cli.js'
import { toYargs } from '@polymech/commons'

import {
    briaBackgroundRemove,
    BriaBackgroundRemoveOptions,
    BriaBackgroundRemoveOptionsSchema
} from '../lib/media/images/background-remove-bria.js'

export const defaultOptions = (yargs: CLI.Argv) => {
    return toYargs(yargs, BriaBackgroundRemoveOptionsSchema(), {
        onKey: ((yargs, key, options) => {
            switch (key) {
                case 'src':
                    return yargs.positional(key, {...options, demandOption: true})
                default:
                    return yargs.option(key, options)
            }
        })
    })
}

export const command = 'background:remove:bria';
export const desc = 'Remove background from images using Bria AI';
export const builder = defaultOptions;

export async function handler(argv: CLI.Arguments) {
    defaults()
    const options = BriaBackgroundRemoveOptionsSchema().parse(argv) as BriaBackgroundRemoveOptions
    logger.settings.minLevel = options.logLevel as any
    const config: any = CONFIG_DEFAULT()

    // Get API key from argument, environment variable, or config
    options.apiKey = options.apiKey || process.env.BRIA_API_TOKEN || config?.bria?.key;

    if (!options.apiKey) {
        logger.error('Bria API key is required. Provide it via --apiKey argument, set BRIA_API_TOKEN environment variable, or configure in config.bria.key');
        logger.info('Get your API key at: https://docs.bria.ai/');
        process.exit(1);
    }

    // The schema already parsed all the options correctly
    const sanitizedOptions = sanitize(options) as BriaBackgroundRemoveOptions

    logger.info("Removing background with Bria AI options:", {
        sync: sanitizedOptions.sync,
        contentModeration: sanitizedOptions.contentModeration,
        preserveAlpha: sanitizedOptions.preserveAlpha,
        files: sanitizedOptions.srcInfo?.FILES?.length || 0
    });

    await briaBackgroundRemove(sanitizedOptions);
}

cli.command(command, desc, builder, handler)

