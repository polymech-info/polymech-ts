import * as fs from 'fs';
import * as path from 'path';
import pMap from 'p-map';
import { z } from 'zod';
import { logger } from '../../../index.js';
import { IOptions } from '../../../types.js';
import { targets } from '../../index.js';
import { sync as mkdir } from '@polymech/fs/dir';
import { generate_interfaces, write, ZodMetaMap } from '@polymech/commons';

// https://replicate.com/cjwbw/rembg
export interface BackgroundRemoveOptions extends IOptions {
  apiKey?: string;
  model?: string;
  alpha_matting?: boolean;
  alpha_matting_foreground_threshold?: number;
  alpha_matting_background_threshold?: number;
  alpha_matting_erode_size?: number;
}

// Zod Schema for background remove options
let schemaMap

export const BackgroundRemoveOptionsSchema = (opts?: any): any => {
    schemaMap = ZodMetaMap.create()
    
    schemaMap.add(
        'src',
        z.string()
            .min(1)
            .describe('FILE|FOLDER|GLOB - Source file(s) to remove background from')
    )
    .add(
        'dst',
        z.string()
            .optional()
            .describe('FILE|FOLDER|GLOB - Destination for processed files')
    )
    .add(
        'debug',
        z.boolean()
            .default(false)
            .describe('Enable internal debug messages')
    )
    .add(
        'alt',
        z.boolean()
            .default(false)
            .describe('Use alternate tokenizer, & instead of $')
    )
    .add(
        'dry',
        z.boolean()
            .default(false)
            .describe('Run without conversion')
    )
    .add(
        'verbose',
        z.boolean()
            .default(false)
            .describe('Show internal messages')
    )
    .add(
        'logLevel',
        z.enum(['warn', 'info', 'debug', 'error'])
            .default('info')
            .describe('Log level: warn, info, debug, error')
    )
    .add(
        'apiKey',
        z.string()
            .optional()
            .describe('Replicate API key (or set REPLICATE_API_TOKEN env var)')
    )
    .add(
        'model',
        z.string()
            .default('lucataco/remove-bg:95fcc2a26d3899cd6c2691c900465aaeff466285a65c14638cc5f36f34befaf1')
            .describe('Background removal model to use')
    )
    .add(
        'alpha_matting',
        z.boolean()
            .default(false)
            .describe('Enable alpha matting for better edge refinement')
    )
    .add(
        'alpha_matting_foreground_threshold',
        z.number()
            .int()
            .min(0)
            .max(500)
            .default(270)
            .describe('Alpha matting foreground threshold')
    )
    .add(
        'alpha_matting_background_threshold',
        z.number()
            .int()
            .min(0)
            .max(100)
            .default(10)
            .describe('Alpha matting background threshold')
    )
    .add(
        'alpha_matting_erode_size',
        z.number()
            .int()
            .min(0)
            .max(50)
            .default(10)
            .describe('Alpha matting erode size')
    )

    return schemaMap.root()
        .passthrough()
        .describe('IBackgroundRemoveOptions')
}

export const types = () => {
    generate_interfaces([BackgroundRemoveOptionsSchema()], 'src/zod_types_background_remove.ts')
    schemas()
}

export const schemas = () => {
    const schema = BackgroundRemoveOptionsSchema()
    write([schema], 'schemas_background_remove.json', 'background-remove', {})
    // Note: schema_ui.json would need ZodMetaMap.getUISchema() implementation
    if (schemaMap && typeof schemaMap.getUISchema === 'function') {
        import('fs').then(fs => {
            fs.writeFileSync('schema_ui_background_remove.json', JSON.stringify(schemaMap.getUISchema(), null, 2))
        }).catch(err => {
            console.warn('Could not write UI schema:', err.message)
        })
    }
}

// Base64 encode image file
function encodeImageToBase64(filePath: string): string {
  const imageBuffer = fs.readFileSync(filePath);
  return `data:image/${path.extname(filePath).slice(1)};base64,${imageBuffer.toString('base64')}`;
}

// Save FileOutput from Replicate API to file
async function saveReplicateOutput(output: any, outputPath: string): Promise<void> {
  // Ensure output directory exists
  mkdir(path.dirname(outputPath));
  
  // Handle FileOutput from Replicate API
  if (output && typeof output.url === 'function') {
    // This is a FileOutput object from Replicate
    await fs.promises.writeFile(outputPath, output);
  } else if (typeof output === 'string' && output.startsWith('http')) {
    // This is a URL, fetch and save the image
    const response = await fetch(output);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(outputPath, buffer);
  } else if (typeof output === 'string') {
    // This might be base64 data
    let base64String = output.replace(/^data:image\/[a-z]+;base64,/, '');
    const imageBuffer = Buffer.from(base64String, 'base64');
    fs.writeFileSync(outputPath, imageBuffer);
  } else if (Buffer.isBuffer(output)) {
    // Already a buffer
    fs.writeFileSync(outputPath, output);
  } else {
    throw new Error(`Unexpected output format: ${typeof output}, ${JSON.stringify(output).substring(0, 200)}`);
  }
}

export async function removeBackgroundFile(
  inputPath: string,
  outputPath: string,
  options: BackgroundRemoveOptions
): Promise<void> {
  try {
    if (!options.apiKey) {
      throw new Error('Replicate API key is required. Set it via --apiKey or REPLICATE_API_TOKEN environment variable');
    }

    // Import Replicate dynamically to handle potential installation issues
    let Replicate;
    try {
      const replicateModule = await import('replicate');
      Replicate = replicateModule.default;
    } catch (error) {
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

    await saveReplicateOutput(output, outputPath)    
    logger.info(`Background removed: ${inputPath} → ${outputPath}`)
  } catch (error) {
    logger.error(`Failed to remove background from ${inputPath}:`, error.message);
    throw error;
  }
}

const _backgroundRemove = async (
  file: string, 
  targets: string[], 
  onNode: (data: any) => void = () => {}, 
  options: BackgroundRemoveOptions
) => {
  return pMap(targets, async (target) => {
    options.verbose && logger.debug(`Removing background ${file} to ${target}`);
    if (options.dry) {
      logger.info(`[DRY RUN] Would remove background: ${file} → ${target}`);
      return;
    }
    return await removeBackgroundFile(file, target, options);
  }, { concurrency: 1 });
};

export const backgroundRemove = async (options: BackgroundRemoveOptions) => {
  let reports: any = []
  const onNode = (data: any) => reports.push(data)  
  if (options.srcInfo) {
    logger.info(`Removing background from ${options.srcInfo.FILES.length} files`);
    return await pMap(options.srcInfo.FILES, async (f) => {
      const outputs = targets(f, options)
      return _backgroundRemove(f, outputs, onNode, options)
    }, { concurrency: 1 })
  } else {
    options.debug && logger.error(`Invalid source info`)
  }
};
