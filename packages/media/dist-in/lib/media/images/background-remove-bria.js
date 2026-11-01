import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import pMap from 'p-map';
import { z } from 'zod';
import { logger } from '../../../index.js';
import { targets } from '../../index.js';
import { sync as mkdir } from '@polymech/fs/dir';
import { generate_interfaces, write, ZodMetaMap } from '@polymech/commons';
// Zod Schema for Bria background remove options
let schemaMap;
export const BriaBackgroundRemoveOptionsSchema = (opts) => {
    schemaMap = ZodMetaMap.create();
    schemaMap.add('src', z.string()
        .min(1)
        .describe('FILE|FOLDER|GLOB - Source file(s) to remove background from'))
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
        .add('cache', z.boolean()
        .default(true)
        .describe('Skip processing if target file already exists'))
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
        .describe('Preserve alpha channel from input image'))
        .add('jpg', z.boolean()
        .default(false)
        .describe('Convert PNG output to JPG format and delete PNG'));
    return schemaMap.root()
        .passthrough()
        .describe('IBriaBackgroundRemoveOptions');
};
export const types = () => {
    generate_interfaces([BriaBackgroundRemoveOptionsSchema()], 'src/zod_types_background_remove_bria.ts');
    schemas();
};
export const schemas = () => {
    const schema = BriaBackgroundRemoveOptionsSchema();
    write([schema], 'schemas_background_remove_bria.json', 'background-remove-bria', {});
    // Note: schema_ui.json would need ZodMetaMap.getUISchema() implementation
    if (schemaMap && typeof schemaMap.getUISchema === 'function') {
        import('fs').then(fs => {
            fs.writeFileSync('schema_ui_background_remove_bria.json', JSON.stringify(schemaMap.getUISchema(), null, 2));
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
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    // Ensure output directory exists
    mkdir(path.dirname(outputPath));
    fs.writeFileSync(outputPath, buffer);
}
// Convert PNG to JPG while preserving rotation and metadata
async function convertPngToJpg(pngPath, jpgPath) {
    try {
        await sharp(pngPath)
            .jpeg({
            quality: 95,
            progressive: true
        })
            .withMetadata() // Preserve EXIF data including rotation
            .toFile(jpgPath);
        // Delete the temporary PNG file
        fs.unlinkSync(pngPath);
        logger.debug(`Converted PNG to JPG and cleaned up: ${pngPath} → ${jpgPath}`);
    }
    catch (error) {
        logger.error(`Failed to convert PNG to JPG: ${error.message}`);
        throw error;
    }
}
export async function removeBriaBackground(inputPath, outputPath, options) {
    try {
        if (!options.apiKey) {
            throw new Error('Bria API key is required. Set it via --apiKey or config.bria.key');
        }
        logger.debug(`Removing background from ${inputPath} using Bria AI`);
        // Read image file as buffer
        const imageBuffer = readImageFile(inputPath);
        const fileName = path.basename(inputPath);
        // Prepare form data for Bria API
        const formData = new FormData();
        // Create a Blob from the image buffer with proper MIME type
        const imageBlob = new Blob([imageBuffer], {
            type: `image/${path.extname(inputPath).slice(1).toLowerCase()}`
        });
        // Add the image file as Blob
        formData.append('file', imageBlob, fileName);
        // Add options
        formData.append('sync', String(options.sync !== false));
        formData.append('content_moderation', String(options.contentModeration || false));
        formData.append('preserve_alpha', String(options.preserveAlpha !== false));
        // Call Bria AI background removal API
        const response = await fetch('https://engine.prod.bria-api.com/v1/background/remove', {
            method: 'POST',
            headers: {
                'api_token': options.apiKey
                // Don't set Content-Type, let fetch set it for FormData
            },
            body: formData
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
            if (options.jpg && path.extname(outputPath).toLowerCase() === '.jpg') {
                // If JPG conversion is requested and output is JPG, download as PNG first then convert
                const tempPngPath = outputPath.replace(/\.jpe?g$/i, '_temp.png');
                await downloadImageFromUrl(imageUrl, tempPngPath);
                await convertPngToJpg(tempPngPath, outputPath);
                logger.info(`Background removed and converted to JPG: ${inputPath} → ${outputPath}`);
            }
            else {
                // Standard PNG output
                await downloadImageFromUrl(imageUrl, outputPath);
                logger.info(`Background removed: ${inputPath} → ${outputPath}`);
            }
        }
        else {
            throw new Error('No image result returned from Bria API');
        }
    }
    catch (error) {
        logger.error(`Failed to remove background from ${inputPath} using Bria:`, error.message);
        throw error;
    }
}
const _briaBackgroundRemove = async (file, targets, onNode = () => { }, options) => {
    return pMap(targets, async (target) => {
        const result = { src: file, dst: target };
        options.verbose && logger.debug(`Removing background ${file} to ${target} using Bria AI`);
        if (options.dry) {
            logger.info(`[DRY RUN] Would remove background using Bria AI: ${file} → ${target}`);
            return result;
        }
        // Skip if cache is enabled and target file already exists
        if (options.cache && fs.existsSync(target)) {
            logger.debug(`Skipping ${target} - file already exists (cache enabled)`);
            return result;
        }
        await removeBriaBackground(file, target, options);
        return result;
    }, { concurrency: 1 });
};
export const briaBackgroundRemove = async (options) => {
    if (options.srcInfo) {
        options.verbose && logger.info(`Removing background from ${options.srcInfo.FILES.length} files using Bria AI`);
        const results = await pMap(options.srcInfo.FILES, async (f) => {
            const outputs = targets(f, options);
            options.verbose && logger.info(`Removing background ${f} to`, outputs);
            return _briaBackgroundRemove(f, outputs, () => { }, options);
        }, { concurrency: 1 });
        // Flatten the results array since _briaBackgroundRemove returns an array for each file
        return results.flat();
    }
    else {
        options.debug && logger.error(`Invalid source info`);
        return [];
    }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFja2dyb3VuZC1yZW1vdmUtYnJpYS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9saWIvbWVkaWEvaW1hZ2VzL2JhY2tncm91bmQtcmVtb3ZlLWJyaWEudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxLQUFLLEVBQUUsTUFBTSxJQUFJLENBQUM7QUFDekIsT0FBTyxLQUFLLElBQUksTUFBTSxNQUFNLENBQUM7QUFDN0IsT0FBTyxLQUFLLE1BQU0sT0FBTyxDQUFDO0FBQzFCLE9BQU8sSUFBSSxNQUFNLE9BQU8sQ0FBQztBQUN6QixPQUFPLEVBQUUsQ0FBQyxFQUFFLE1BQU0sS0FBSyxDQUFDO0FBQ3hCLE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxtQkFBbUIsQ0FBQztBQUUzQyxPQUFPLEVBQUUsT0FBTyxFQUFFLE1BQU0sZ0JBQWdCLENBQUM7QUFDekMsT0FBTyxFQUFFLElBQUksSUFBSSxLQUFLLEVBQUUsTUFBTSxrQkFBa0IsQ0FBQztBQUNqRCxPQUFPLEVBQUUsbUJBQW1CLEVBQUUsS0FBSyxFQUFFLFVBQVUsRUFBRSxNQUFNLG1CQUFtQixDQUFDO0FBVTNFLGdEQUFnRDtBQUNoRCxJQUFJLFNBQVMsQ0FBQTtBQUViLE1BQU0sQ0FBQyxNQUFNLGlDQUFpQyxHQUFHLENBQUMsSUFBVSxFQUFPLEVBQUU7SUFDakUsU0FBUyxHQUFHLFVBQVUsQ0FBQyxNQUFNLEVBQUUsQ0FBQTtJQUUvQixTQUFTLENBQUMsR0FBRyxDQUNULEtBQUssRUFDTCxDQUFDLENBQUMsTUFBTSxFQUFFO1NBQ0wsR0FBRyxDQUFDLENBQUMsQ0FBQztTQUNOLFFBQVEsQ0FBQyw2REFBNkQsQ0FBQyxDQUMvRTtTQUNBLEdBQUcsQ0FDQSxLQUFLLEVBQ0wsQ0FBQyxDQUFDLE1BQU0sRUFBRTtTQUNMLFFBQVEsRUFBRTtTQUNWLFFBQVEsQ0FBQyxvREFBb0QsQ0FBQyxDQUN0RTtTQUNBLEdBQUcsQ0FDQSxPQUFPLEVBQ1AsQ0FB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