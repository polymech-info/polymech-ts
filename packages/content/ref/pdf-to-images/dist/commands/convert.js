import { Logger } from 'tslog';
import { ConvertCommandSchema } from '../types.js';
import { existsSync } from 'node:fs';
import * as z from 'zod';
import { runConversion } from '../lib/convert.js';
export const command = 'convert';
export const desc = 'Convert PDF to images';
export async function handler(argv) {
    const logger = new Logger();
    try {
        const config = ConvertCommandSchema.parse(argv);
        if (!existsSync(config.input)) {
            throw new Error(`Input file ${config.input} does not exist`);
        }
        logger.info("Calling conversion library function...");
        const outputFiles = await runConversion(config, logger);
        logger.info(`Conversion completed successfully`);
        logger.info(`Generated ${outputFiles.length} images`);
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            logger.error('Invalid arguments:', error.flatten());
        }
        else {
            const message = error instanceof Error ? error.message : String(error);
            logger.error('Error during conversion command:', message, error);
        }
        process.exit(1);
    }
}
