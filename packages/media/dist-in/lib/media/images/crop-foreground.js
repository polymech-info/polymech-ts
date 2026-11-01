import * as fs from 'fs';
import * as path from 'path';
import pMap from 'p-map';
import { z } from 'zod';
import { logger } from '../../../index.js';
import { sync as mkdir } from '@polymech/fs/dir';
import { targets } from '../../index.js';
import { generate_interfaces, write, ZodMetaMap } from '@polymech/commons';
// Zod Schema for crop foreground options
let schemaMap;
export const CropForegroundOptionsSchema = (opts) => {
    schemaMap = ZodMetaMap.create();
    schemaMap.add('src', z.string()
        .min(1)
        .describe('FILE|FOLDER|GLOB - Source file(s) to crop foreground from'))
        .add('dst', z.string()
        .optional()
        .describe('FILE|FOLDER|GLOB - Destination for processed files'))
        .add('debug', z.boolean()
        .default(false)
        .describe('Enable internal debug messages'))
        .add('alt', z.boolean()
        .default(false)
        .describe('Use alternate tokenizer, & instead of $'))
        .add('dry', z.boolean()
        .default(false)
        .describe('Run without conversion'))
        .add('verbose', z.boolean()
        .default(false)
        .describe('Show internal messages'))
        .add('logLevel', z.enum(['warn', 'info', 'debug', 'error'])
        .default('info')
        .describe('Log level: warn, info, debug, error'))
        .add('apiKey', z.string()
        .optional()
        .describe('Bria API key (or set in config.bria.key)'))
        .add('sync', z.boolean()
        .default(true)
        .describe('Use synchronous processing (recommended)'))
        .add('contentModeration', z.boolean()
        .default(false)
        .describe('Enable content moderation'))
        .add('preserveAlpha', z.boolean()
        .default(true)
        .describe('Preserve alpha channel from input image'));
    return schemaMap.root()
        .passthrough()
        .describe('ICropForegroundOptions');
};
export const types = () => {
    generate_interfaces([CropForegroundOptionsSchema()], 'src/zod_types_crop_foreground.ts');
    schemas();
};
export const schemas = () => {
    const schema = CropForegroundOptionsSchema();
    write([schema], 'schemas_crop_foreground.json', 'crop-foreground', {});
    // Note: schema_ui.json would need ZodMetaMap.getUISchema() implementation
    if (schemaMap && typeof schemaMap.getUISchema === 'function') {
        import('fs').then(fs => {
            fs.writeFileSync('schema_ui_crop_foreground.json', JSON.stringify(schemaMap.getUISchema(), null, 2));
        }).catch(err => {
            console.warn('Could not write UI schema:', err.message);
        });
    }
};
// Read image file as buffer for Bria API
function readImageFile(filePath) {
    return fs.readFileSync(filePath);
}
// Download image from URL and save to file
async function downloadImageFromUrl(imageUrl, outputPath) {
    const response = await fetch(imageUrl);
    if (!response.ok) {
        throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
    }
    // Ensure output directory exists
    mkdir(path.dirname(outputPath));
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(outputPath, buffer);
}
// Crop foreground from a single image using Bria API
async function cropForegroundFile(inputPath, outputPath, options) {
    try {
        if (!options.apiKey) {
            throw new Error('Bria API key is required. Set it via --apiKey or config.bria.key');
        }
        logger.debug(`Cropping foreground from ${inputPath} using Bria AI`);
        // Read image file and encode as base64
        const imageBuffer = readImageFile(inputPath);
        const base64Image = imageBuffer.toString('base64');
        // Prepare JSON payload for Bria API
        const payload = {
            file: base64Image,
            sync: options.sync !== false,
            content_moderation: options.contentModeration || false,
            preserve_alpha: options.preserveAlpha !== false
        };
        // Call Bria AI crop foreground API
        const response = await fetch('https://engine.prod.bria-api.com/v1/crop', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api_token': options.apiKey
            },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Bria API error: ${response.status} ${response.statusText} - ${errorText}`);
        }
        const result = await response.json();
        logger.debug(`Bria API response:`, result);
        // Handle the response
        if (result.result_url || result.image_res) {
            // Download the processed image (Bria API uses result_url)
            const imageUrl = result.result_url || result.image_res;
            await downloadImageFromUrl(imageUrl, outputPath);
            logger.info(`Foreground cropped: ${inputPath} → ${outputPath}`);
        }
        else {
            throw new Error('No image result returned from Bria API');
        }
    }
    catch (error) {
        logger.error(`Failed to crop foreground from ${inputPath} using Bria:`, error.message);
        throw error;
    }
}
// Main function to crop foreground from multiple images
export async function cropForeground(options) {
    if (options.dry) {
        logger.info(`[DRY RUN] Would crop foreground using Bria AI: ${options.srcInfo?.FILES?.length || 0} files`);
        return;
    }
    if (!options.srcInfo?.FILES?.length) {
        logger.warn('No input files found');
        return;
    }
    logger.info(`Cropping foreground from ${options.srcInfo.FILES.length} files using Bria AI`);
    await pMap(options.srcInfo.FILES, async (src) => {
        const dstAll = targets(src, options);
        logger.info(`Cropping foreground ${src} to`, dstAll);
        await pMap(dstAll, async (dst) => {
            logger.debug(`Cropping foreground ${src} to ${dst} using Bria AI`);
            if (options.dry) {
                logger.info(`[DRY RUN] Would crop foreground using Bria AI: ${src} → ${dst}`);
                return;
            }
            await cropForegroundFile(src, dst, options);
        }, { concurrency: 1 });
    }, { concurrency: 2 });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3JvcC1mb3JlZ3JvdW5kLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2xpYi9tZWRpYS9pbWFnZXMvY3JvcC1mb3JlZ3JvdW5kLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sS0FBSyxFQUFFLE1BQU0sSUFBSSxDQUFDO0FBQ3pCLE9BQU8sS0FBSyxJQUFJLE1BQU0sTUFBTSxDQUFDO0FBQzdCLE9BQU8sSUFBSSxNQUFNLE9BQU8sQ0FBQztBQUN6QixPQUFPLEVBQUUsQ0FBQyxFQUFFLE1BQU0sS0FBSyxDQUFDO0FBQ3hCLE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxtQkFBbUIsQ0FBQztBQUMzQyxPQUFPLEVBQUUsSUFBSSxJQUFJLEtBQUssRUFBRSxNQUFNLGtCQUFrQixDQUFDO0FBRWpELE9BQU8sRUFBRSxPQUFPLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQztBQUN6QyxPQUFPLEVBQUUsbUJBQW1CLEVBQUUsS0FBSyxFQUFFLFVBQVUsRUFBRSxNQUFNLG1CQUFtQixDQUFDO0FBUzNFLHlDQUF5QztBQUN6QyxJQUFJLFNBQVMsQ0FBQTtBQUViLE1BQU0sQ0FBQyxNQUFNLDJCQUEyQixHQUFHLENBQUMsSUFBVSxFQUFPLEVBQUU7SUFDM0QsU0FBUyxHQUFHLFVBQVUsQ0FBQyxNQUFNLEVBQUUsQ0FBQTtJQUUvQixTQUFTLENBQUMsR0FBRyxDQUNULEtBQUssRUFDTCxDQUFDLENBQUMsTUFBTSxFQUFFO1NBQ0wsR0FBRyxDQUFDLENBQUMsQ0FBQztTQUNOLFFBQVEsQ0FBQywyREFBMkQsQ0FBQyxDQUM3RTtTQUNBLEdBQUcsQ0FDQSxLQUFLLEVBQ0wsQ0FBQyxDQUFDLE1BQU0sRUFBRTtTQUNMLFFBQVEsRUFBRTtTQUNWLFFBQVEsQ0FBQyxvREFBb0QsQ0FBQyxDQUN0RTtTQUNBLEdBQUcsQ0FDQSxPQUFPLEVBQ1AsQ0FBQyxDQUFDLE9BQU8sRUFBRTtTQUNOLE9BQU8sQ0FBQyxLQUFLLENBQUM7U0FD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