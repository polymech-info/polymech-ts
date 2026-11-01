import * as fs from 'fs';
import * as path from 'path';
import pMap from 'p-map';
import { z } from 'zod';
import { logger } from '../../../index.js';
import { targets } from '../../index.js';
import { sync as mkdir } from '@polymech/fs/dir';
import { generate_interfaces, write, ZodMetaMap } from '@polymech/commons';
// Zod Schema for background remove options
let schemaMap;
export const BackgroundRemoveOptionsSchema = (opts) => {
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
        .add('apiKey', z.string()
        .optional()
        .describe('Replicate API key (or set REPLICATE_API_TOKEN env var)'))
        .add('model', z.string()
        .default('lucataco/remove-bg:95fcc2a26d3899cd6c2691c900465aaeff466285a65c14638cc5f36f34befaf1')
        .describe('Background removal model to use'))
        .add('alpha_matting', z.boolean()
        .default(false)
        .describe('Enable alpha matting for better edge refinement'))
        .add('alpha_matting_foreground_threshold', z.number()
        .int()
        .min(0)
        .max(500)
        .default(270)
        .describe('Alpha matting foreground threshold'))
        .add('alpha_matting_background_threshold', z.number()
        .int()
        .min(0)
        .max(100)
        .default(10)
        .describe('Alpha matting background threshold'))
        .add('alpha_matting_erode_size', z.number()
        .int()
        .min(0)
        .max(50)
        .default(10)
        .describe('Alpha matting erode size'));
    return schemaMap.root()
        .passthrough()
        .describe('IBackgroundRemoveOptions');
};
export const types = () => {
    generate_interfaces([BackgroundRemoveOptionsSchema()], 'src/zod_types_background_remove.ts');
    schemas();
};
export const schemas = () => {
    const schema = BackgroundRemoveOptionsSchema();
    write([schema], 'schemas_background_remove.json', 'background-remove', {});
    // Note: schema_ui.json would need ZodMetaMap.getUISchema() implementation
    if (schemaMap && typeof schemaMap.getUISchema === 'function') {
        import('fs').then(fs => {
            fs.writeFileSync('schema_ui_background_remove.json', JSON.stringify(schemaMap.getUISchema(), null, 2));
        }).catch(err => {
            console.warn('Could not write UI schema:', err.message);
        });
    }
};
// Base64 encode image file
function encodeImageToBase64(filePath) {
    const imageBuffer = fs.readFileSync(filePath);
    return `data:image/${path.extname(filePath).slice(1)};base64,${imageBuffer.toString('base64')}`;
}
// Save FileOutput from Replicate API to file
async function saveReplicateOutput(output, outputPath) {
    // Ensure output directory exists
    mkdir(path.dirname(outputPath));
    // Handle FileOutput from Replicate API
    if (output && typeof output.url === 'function') {
        // This is a FileOutput object from Replicate
        await fs.promises.writeFile(outputPath, output);
    }
    else if (typeof output === 'string' && output.startsWith('http')) {
        // This is a URL, fetch and save the image
        const response = await fetch(output);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        fs.writeFileSync(outputPath, buffer);
    }
    else if (typeof output === 'string') {
        // This might be base64 data
        let base64String = output.replace(/^data:image\/[a-z]+;base64,/, '');
        const imageBuffer = Buffer.from(base64String, 'base64');
        fs.writeFileSync(outputPath, imageBuffer);
    }
    else if (Buffer.isBuffer(output)) {
        // Already a buffer
        fs.writeFileSync(outputPath, output);
    }
    else {
        throw new Error(`Unexpected output format: ${typeof output}, ${JSON.stringify(output).substring(0, 200)}`);
    }
}
export async function removeBackgroundFile(inputPath, outputPath, options) {
    try {
        if (!options.apiKey) {
            throw new Error('Replicate API key is required. Set it via --apiKey or REPLICATE_API_TOKEN environment variable');
        }
        // Import Replicate dynamically to handle potential installation issues
        let Replicate;
        try {
            const replicateModule = await import('replicate');
            Replicate = replicateModule.default;
        }
        catch (error) {
            throw new Error('Replicate package not found. Please install it with: npm install replicate');
        }
        const replicate = new Replicate({
            auth: options.apiKey,
        });
        // Encode input image to base64 data URL
        const inputImageBase64 = encodeImageToBase64(inputPath);
        // Prepare input for the model
        const input = {
            image: inputImageBase64,
            alpha_matting: 'alpha_matting' in options ? options.alpha_matting : false,
            alpha_matting_foreground_threshold: 'alpha_matting_foreground_threshold' in options ? options.alpha_matting_foreground_threshold : 270,
            alpha_matting_background_threshold: 'alpha_matting_background_threshold' in options ? options.alpha_matting_background_threshold : 10,
            alpha_matting_erode_size: 'alpha_matting_erode_size' in options ? options.alpha_matting_erode_size : 10,
        };
        const output = await replicate.run(options.model, {
            input
        });
        await saveReplicateOutput(output, outputPath);
        logger.info(`Background removed: ${inputPath} → ${outputPath}`);
    }
    catch (error) {
        logger.error(`Failed to remove background from ${inputPath}:`, error.message);
        throw error;
    }
}
const _backgroundRemove = async (file, targets, onNode = () => { }, options) => {
    return pMap(targets, async (target) => {
        options.verbose && logger.debug(`Removing background ${file} to ${target}`);
        if (options.dry) {
            logger.info(`[DRY RUN] Would remove background: ${file} → ${target}`);
            return;
        }
        return await removeBackgroundFile(file, target, options);
    }, { concurrency: 1 });
};
export const backgroundRemove = async (options) => {
    let reports = [];
    const onNode = (data) => reports.push(data);
    if (options.srcInfo) {
        logger.info(`Removing background from ${options.srcInfo.FILES.length} files`);
        return await pMap(options.srcInfo.FILES, async (f) => {
            const outputs = targets(f, options);
            return _backgroundRemove(f, outputs, onNode, options);
        }, { concurrency: 1 });
    }
    else {
        options.debug && logger.error(`Invalid source info`);
    }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFja2dyb3VuZC1yZW1vdmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvbGliL21lZGlhL2ltYWdlcy9iYWNrZ3JvdW5kLXJlbW92ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEtBQUssRUFBRSxNQUFNLElBQUksQ0FBQztBQUN6QixPQUFPLEtBQUssSUFBSSxNQUFNLE1BQU0sQ0FBQztBQUM3QixPQUFPLElBQUksTUFBTSxPQUFPLENBQUM7QUFDekIsT0FBTyxFQUFFLENBQUMsRUFBRSxNQUFNLEtBQUssQ0FBQztBQUN4QixPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sbUJBQW1CLENBQUM7QUFFM0MsT0FBTyxFQUFFLE9BQU8sRUFBRSxNQUFNLGdCQUFnQixDQUFDO0FBQ3pDLE9BQU8sRUFBRSxJQUFJLElBQUksS0FBSyxFQUFFLE1BQU0sa0JBQWtCLENBQUM7QUFDakQsT0FBTyxFQUFFLG1CQUFtQixFQUFFLEtBQUssRUFBRSxVQUFVLEVBQUUsTUFBTSxtQkFBbUIsQ0FBQztBQVkzRSwyQ0FBMkM7QUFDM0MsSUFBSSxTQUFTLENBQUE7QUFFYixNQUFNLENBQUMsTUFBTSw2QkFBNkIsR0FBRyxDQUFDLElBQVUsRUFBTyxFQUFFO0lBQzdELFNBQVMsR0FBRyxVQUFVLENBQUMsTUFBTSxFQUFFLENBQUE7SUFFL0IsU0FBUyxDQUFDLEdBQUcsQ0FDVCxLQUFLLEVBQ0wsQ0FBQyxDQUFDLE1BQU0sRUFBRTtTQUNMLEdBQUcsQ0FBQyxDQUFDLENBQUM7U0FDTixRQUFRLENBQUMsNkRBQTZELENBQUMsQ0FDL0U7U0FDQSxHQUFHLENBQ0EsS0FBSyxFQUNMLENBQUMsQ0FBQyxNQUFNLEVBQUU7U0FDTCxRQUFRLEVBQUU7U0FDVixRQUFRLENBQUMsb0RBQW9ELENBQUMsQ0FDdEU7U0FDQSxHQUFHLENBQ0EsT0FBTyxFQUNQLENBQUMsQ0FBQyxPQUFPLEVBQUU7U0FDTixPQUFPLENBQUMsS0FBSyxDQUFD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