import * as CLI from 'yargs'
import { logger } from '../index.js'
import { existsSync } from 'node:fs';
import * as z from 'zod';
import { runConversion, Pdf2JpgOptionsSchema, Pdf2JpgConfig } from '../lib/pdf/convert.js';
import { toYargs } from '@polymech/commons';
import { cli } from '../cli.js';

export const command = 'pdf2jpg';
export const desc = 'Convert PDF to images';

export const builder = (yargs: CLI.Argv) => {
    return toYargs(yargs, Pdf2JpgOptionsSchema(), {
        onKey: ((yargs, key, options) => {
            switch (key) {
                case 'input':
                    return yargs.option(key, {...options, alias: 'i', demandOption: true})
                case 'output':
                    return yargs.option(key, {...options, alias: 'o'})
                default:
                    return yargs.option(key, options)
            }
        })
    })
}

export async function handler(argv: CLI.Arguments) {
    try {
        const config: Pdf2JpgConfig = Pdf2JpgOptionsSchema().parse(argv);
        
        // Validate startPage and endPage relationship
        if (config.startPage !== undefined && config.endPage !== undefined) {
            if (config.startPage > config.endPage) {
                throw new Error('startPage must be less than or equal to endPage');
            }
        }
        
        if (!existsSync(config.input)) {
            throw new Error(`Input file ${config.input} does not exist`);
        }
        logger.info("Calling conversion library function...");
        const outputFiles = await runConversion(config, logger);
        logger.info(`Conversion completed successfully`);
        logger.info(`Generated ${outputFiles.length} images`);
    } catch (error) {
        if (error instanceof z.ZodError) {
            logger.error('Invalid arguments:', error.flatten());
        } else {
            const message = error instanceof Error ? error.message : String(error);
            logger.error('Error during conversion command:', message, error);
        }
        process.exit(1);
    }
}

cli.command(command, desc, builder, handler)
