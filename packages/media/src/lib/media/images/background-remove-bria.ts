import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import pMap from 'p-map';
import { z } from 'zod';
import { logger } from '../../../index.js';
import { IOptions } from '../../../types.js';
import { targets } from '../../index.js';
import { sync as mkdir } from '@polymech/fs/dir';
import { generate_interfaces, write, ZodMetaMap } from '@polymech/commons';

export interface BriaBackgroundRemoveOptions extends IOptions {
  apiKey?: string;
  sync?: boolean;
  contentModeration?: boolean;
  preserveAlpha?: boolean;
  jpg?: boolean;
}

// Zod Schema for Bria background remove options
let schemaMap

export const BriaBackgroundRemoveOptionsSchema = (opts?: any): any => {
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
        'cache',
        z.boolean()
            .default(true)
            .describe('Skip processing if target file already exists')
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
    .add(
        'jpg',
        z.boolean()
            .default(false)
            .describe('Convert PNG output to JPG format and delete PNG')
    )

    return schemaMap.root()
        .passthrough()
        .describe('IBriaBackgroundRemoveOptions')
}

export const types = () => {
    generate_interfaces([BriaBackgroundRemoveOptionsSchema()], 'src/zod_types_background_remove_bria.ts')
    schemas()
}

export const schemas = () => {
    const schema = BriaBackgroundRemoveOptionsSchema()
    write([schema], 'schemas_background_remove_bria.json', 'background-remove-bria', {})
    // Note: schema_ui.json would need ZodMetaMap.getUISchema() implementation
    if (schemaMap && typeof schemaMap.getUISchema === 'function') {
        import('fs').then(fs => {
            fs.writeFileSync('schema_ui_background_remove_bria.json', JSON.stringify(schemaMap.getUISchema(), null, 2))
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
  
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  // Ensure output directory exists
  mkdir(path.dirname(outputPath));
  
  fs.writeFileSync(outputPath, buffer);
}

// Convert PNG to JPG while preserving rotation and metadata
async function convertPngToJpg(pngPath: string, jpgPath: string): Promise<void> {
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
  } catch (error) {
    logger.error(`Failed to convert PNG to JPG: ${error.message}`);
    throw error;
  }
}

export async function removeBriaBackground(
  inputPath: string,
  outputPath: string,
  options: BriaBackgroundRemoveOptions
): Promise<void> {
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
      } else {
        // Standard PNG output
        await downloadImageFromUrl(imageUrl, outputPath);
        logger.info(`Background removed: ${inputPath} → ${outputPath}`);
      }
    } else {
      throw new Error('No image result returned from Bria API');
    }

  } catch (error) {
    logger.error(`Failed to remove background from ${inputPath} using Bria:`, error.message);
    throw error;
  }
}

const _briaBackgroundRemove = async (
  file: string, 
  targets: string[], 
  onNode: (data: any) => void = () => {}, 
  options: BriaBackgroundRemoveOptions
) => {
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

export const briaBackgroundRemove = async (options: BriaBackgroundRemoveOptions) => {
  if (options.srcInfo) {
    options.verbose && logger.info(`Removing background from ${options.srcInfo.FILES.length} files using Bria AI`);
    const results = await pMap(options.srcInfo.FILES, async (f) => {
      const outputs = targets(f, options);
      options.verbose && logger.info(`Removing background ${f} to`, outputs);
      return _briaBackgroundRemove(f, outputs, () => {}, options);
    }, { concurrency: 1 });
    
    // Flatten the results array since _briaBackgroundRemove returns an array for each file
    return results.flat();
  } else {
    options.debug && logger.error(`Invalid source info`);
    return [];
  }
};
