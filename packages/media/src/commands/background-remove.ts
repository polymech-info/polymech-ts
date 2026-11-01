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
    backgroundRemove,
    BackgroundRemoveOptions,
    BackgroundRemoveOptionsSchema
} from '../lib/media/images/background-remove.js'

export const defaultOptions = (yargs: CLI.Argv) => {
    return toYargs(yargs, BackgroundRemoveOptionsSchema(), {
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

export const command = 'background:remove';
export const desc = 'Remove background from images using AI';
export const builder = defaultOptions;

export async function handler(argv: CLI.Arguments) {
    defaults()
    const options = BackgroundRemoveOptionsSchema().parse(argv) as BackgroundRemoveOptions
    logger.settings.minLevel = options.logLevel as any
    const config: any = CONFIG_DEFAULT()

    // Get API key from argument or environment variable
    options.apiKey = options.apiKey || process.env.REPLICATE_API_TOKEN || config?.replicate?.key;

    if (!options.apiKey) {
        logger.error('Replicate API key is required. Provide it via --apiKey argument or set REPLICATE_API_TOKEN environment variable');
        logger.info('Get your API key at: https://replicate.com/account/api-tokens');
        process.exit(1);
    }

    // The schema already parsed all the options correctly
    const sanitizedOptions = sanitize(options) as BackgroundRemoveOptions

    logger.info("Removing background with options:", {
        model: sanitizedOptions.model,
        alpha_matting: sanitizedOptions.alpha_matting,
        files: sanitizedOptions.srcInfo?.FILES?.length || 0
    });

    await backgroundRemove(sanitizedOptions);
}

cli.command(command, desc, builder, handler)
