import * as fs from 'fs';
import * as path from 'path';
import pMap from 'p-map';
import { z } from 'zod';
import { logger } from '../../../index.js';
import { sync as mkdir } from '@polymech/fs/dir';
import { IOptions } from '../../../types.js';
import { targets } from '../../index.js';
import { generate_interfaces, write, ZodMetaMap } from '@polymech/commons';

export interface CropForegroundOptions extends IOptions {
  apiKey: string;
  sync?: boolean;
  contentModeration?: boolean;
  preserveAlpha?: boolean;
}

// Zod Schema for crop foreground options
let schemaMap

export const CropForegroundOptionsSchema = (opts?: any): any => {
    schemaMap = ZodMetaMap.create()
    
    schemaMap.add(
        'src',
        z.string()
            .min(1)
            .describe('FILE|FOLDER|GLOB - Source file(s) to crop foreground from')
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
            .describe('Bria API key (or set in config.bria.key)')
    )
    .add(
        'sync',
        z.boolean()
            .default(true)
            .describe('Use synchronous processing (recommended)')
    )
    .add(
        'contentModeration',
        z.boolean()
            .default(false)
            .describe('Enable content moderation')
    )
    .add(
        'preserveAlpha',
        z.boolean()
            .default(true)
            .describe('Preserve alpha channel from input image')
    )

    return schemaMap.root()
        .passthrough()
        .describe('ICropForegroundOptions')
}

export const types = () => {
    generate_interfaces([CropForegroundOptionsSchema()], 'src/zod_types_crop_foreground.ts')
    schemas()
}

export const schemas = () => {
    const schema = CropForegroundOptionsSchema()
    write([schema], 'schemas_crop_foreground.json', 'crop-foreground', {})
    // Note: schema_ui.json would need ZodMetaMap.getUISchema() implementation
    if (schemaMap && typeof schemaMap.getUISchema === 'function') {
        import('fs').then(fs => {
            fs.writeFileSync('schema_ui_crop_foreground.json', JSON.stringify(schemaMap.getUISchema(), null, 2))
        }).catch(err => {
            console.warn('Could not write UI schema:', err.message)
        })
    }
}

// Read image file as buffer for Bria API
function readImageFile(filePath: string): Buffer {
  return fs.readFileSync(filePath);
}

// Download image from URL and save to file
async function downloadImageFromUrl(imageUrl: string, outputPath: string): Promise<void> {
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
async function cropForegroundFile(
  inputPath: string,
  outputPath: string,
  options: CropForegroundOptions
): Promise<void> {
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
    } else {
      throw new Error('No image result returned from Bria API');
    }

  } catch (error) {
    logger.error(`Failed to crop foreground from ${inputPath} using Bria:`, error.message);
    throw error;
  }
}

// Main function to crop foreground from multiple images
export async function cropForeground(options: CropForegroundOptions): Promise<void> {
  
    if (options.dry) {
    logger.info(`[DRY RUN] Would crop foreground using Bria AI: ${options.srcInfo?.FILES?.length || 0} files`);
    return;
  }

  if (!options.srcInfo?.FILES?.length) {
    logger.warn('No input files found');
    return;
  }

  logger.info(`Cropping foreground from ${options.srcInfo.FILES.length} files using Bria AI`);

  await pMap(
    options.srcInfo.FILES,
    async (src: string) => {
      const dstAll = targets(src, options);
      logger.info(`Cropping foreground ${src} to`, dstAll);

      await pMap(
        dstAll,
        async (dst: string) => {
          logger.debug(`Cropping foreground ${src} to ${dst} using Bria AI`);
          
          if (options.dry) {
            logger.info(`[DRY RUN] Would crop foreground using Bria AI: ${src} → ${dst}`);
            return;
          }

          await cropForegroundFile(src, dst, options);
        },
        { concurrency: 1 }
      );
    },
    { concurrency: 2 }
  );
}
