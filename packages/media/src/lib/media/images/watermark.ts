import sharp, { OverlayOptions } from "sharp";
import * as path from 'path';
import * as fs from 'fs';
import { glob } from 'glob';
import pMap from 'p-map';
import { z } from 'zod';
import { logger } from '../../../index.js';
import { IOptions } from '../../../types.js';
import { targets } from '../../index.js';
import { sync as mkdir } from '@polymech/fs/dir'
import { generate_interfaces, write, ZodMetaMap } from '@polymech/commons'

import { resolve } from '@polymech/commons'

type Corner = "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center";

export interface LogoWatermarkOptions {
  position?: Corner;
  margin?: number;        // px
  sizePct?: number;       // of base image width (0–1)
  opacity?: number;       // 0–1
  blend?: OverlayOptions["blend"];
}

export interface TextWatermarkOptions {
  position?: Corner;
  margin?: number;        // px
  fontSize?: number;      // px
  opacity?: number;       // 0–1
  color?: string;         // hex color like '#ffffff'
  fontFamily?: string;    // font family
  strokeColor?: string;   // outline color
  strokeWidth?: number;   // outline width
}

export interface WatermarkOptions extends IOptions {
  // Raw watermark content (text or file path)
  watermark: string;
  // Styling options that apply to both text and image watermarks
  position?: Corner;
  margin?: number;
  opacity?: number;
  // Text-specific options
  fontSize?: number;
  color?: string;
  fontFamily?: string;
  strokeColor?: string;
  strokeWidth?: number;
  // Image-specific options  
  sizePct?: number;
  blend?: OverlayOptions["blend"];
  
  // Internal properties (set automatically)
  watermarkType?: 'text' | 'image';
  text?: string;
  logoPath?: string;
  textOptions?: TextWatermarkOptions;
  imageOptions?: LogoWatermarkOptions;
}

// Zod Schema for watermark options
let schemaMap

export const WatermarkOptionsSchema = (opts?: any): any => {
    schemaMap = ZodMetaMap.create()
    
    schemaMap.add(
        'src',
        z.string()
            .min(1)
            .describe('FILE|FOLDER|GLOB - Source file(s) to add watermark to')
    )
    .add(
        'dst',
        z.string()
            .optional()
            .describe('FILE|FOLDER|GLOB - Destination for watermarked files')
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
        'watermark',
        z.string()
            .min(1)
            .describe('Watermark content: text string or path to image file (PNG, JPG, SVG)')
    )
    .add(
        'position',
        z.enum(['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'])
            .default('bottom-right')
            .describe('Position of watermark')
    )
    .add(
        'margin',
        z.number()
            .int()
            .min(0)
            .default(24)
            .describe('Margin from edges in pixels')
    )
    .add(
        'opacity',
        z.number()
            .min(0)
            .max(1)
            .default(0.85)
            .describe('Opacity of watermark (0-1)')
    )
    .add(
        'sizePct',
        z.number()
            .min(0)
            .max(1)
            .default(0.2)
            .describe('Size of image watermark as percentage of base image width (0-1)')
    )
    .add(
        'fontSize',
        z.number()
            .int()
            .positive()
            .default(48)
            .describe('Font size for text watermark in pixels')
    )
    .add(
        'color',
        z.string()
            .regex(/^#[0-9a-fA-F]{6}$/)
            .default('#ffffff')
            .describe('Text color (hex format, e.g., #ffffff)')
    )
    .add(
        'fontFamily',
        z.string()
            .default('Arial')
            .describe('Font family for text watermark')
    )
    .add(
        'strokeColor',
        z.string()
            .regex(/^#[0-9a-fA-F]{6}$/)
            .default('#000000')
            .describe('Text stroke color (hex format, e.g., #000000)')
    )
    .add(
        'strokeWidth',
        z.number()
            .int()
            .min(0)
            .default(2)
            .describe('Text stroke width in pixels')
    )

    return schemaMap.root()
        .passthrough()
        .describe('IWatermarkOptions')
}

export const types = () => {
    generate_interfaces([WatermarkOptionsSchema()], 'src/zod_types_watermark.ts')
    schemas()
}

export const schemas = () => {
    const schema = WatermarkOptionsSchema()
    write([schema], 'schemas_watermark.json', 'watermark', {})
    // Note: schema_ui.json would need ZodMetaMap.getUISchema() implementation
    if (schemaMap && typeof schemaMap.getUISchema === 'function') {
        import('fs').then(fs => {
            fs.writeFileSync('schema_ui_watermark.json', JSON.stringify(schemaMap.getUISchema(), null, 2))
        }).catch(err => {
            console.warn('Could not write UI schema:', err.message)
        })
    }
}

export async function addLogoWatermark(
  inputPath: string,
  logoPath: string,
  outputPath: string,
  opts: LogoWatermarkOptions = {}
): Promise<void> {
  const {
    position = "bottom-right",
    margin = 24,
    sizePct = 0.2,
    opacity = 0.85,
    blend = "over",
  } = opts;

  const base = sharp(inputPath);
  const { width: W = 0, height: H = 0 } = await base.metadata();
  if (!W || !H) throw new Error("Could not read base image size");

  // Resize logo to sizePct of base width
  const logoWidth = Math.max(1, Math.round(W * sizePct));
  
  // Handle SVG files specially
  let logoSharp;
  const logoExt = path.extname(logoPath).toLowerCase();
  
  if (logoExt === '.svg') {
    // For SVG files, specify density for better quality
    logoSharp = sharp(logoPath, { 
      density: 300 // High DPI for crisp SVG rendering
    }).resize({ width: logoWidth });
  } else {
    // For other image formats
    logoSharp = sharp(logoPath).resize({ width: logoWidth });
  }
  
  const logoBuf = await logoSharp.toBuffer();
  const { width: w = 0, height: h = 0 } = await sharp(logoBuf).metadata();

  // Compute pixel placement
  const pos = (() => {
    switch (position) {
      case "top-left":     return { left: margin,       top: margin };
      case "top-right":    return { left: W - w - margin, top: margin };
      case "bottom-left":  return { left: margin,       top: H - h - margin };
      case "center":       return { left: Math.round((W - w) / 2), top: Math.round((H - h) / 2) };
      case "bottom-right":
      default:             return { left: W - w - margin, top: H - h - margin };
    }
  })();
  mkdir(path.dirname(outputPath))
  await base
    .composite([{
      input: logoBuf,
      left: pos.left,
      top: pos.top,
      blend,
      ...(opacity < 1 ? { blend: 'multiply' } : {}),
    }])
    .toFile(outputPath);
}

export async function addTextWatermark(
  inputPath: string,
  text: string,
  outputPath: string,
  opts: TextWatermarkOptions = {}
): Promise<void> {
  const {
    position = "bottom-right",
    margin = 24,
    fontSize = 48,
    opacity = 0.8,
    color = '#ffffff',
    fontFamily = 'Arial',
    strokeColor = '#000000',
    strokeWidth = 2,
  } = opts;

  const base = sharp(inputPath);
  const { width: W = 0, height: H = 0 } = await base.metadata();
  if (!W || !H) throw new Error("Could not read base image size");

  // Create SVG text element
  const svgText = `
    <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <text 
        x="${getTextX(position, W, margin)}" 
        y="${getTextY(position, H, margin, fontSize)}"
        font-family="${fontFamily}" 
        font-size="${fontSize}" 
        fill="${color}" 
        opacity="${opacity}"
        stroke="${strokeColor}" 
        stroke-width="${strokeWidth}"
        text-anchor="${getTextAnchor(position)}"
        dominant-baseline="${getTextBaseline(position)}"
      >
        ${text}
      </text>
    </svg>
  `;

  const textBuffer = Buffer.from(svgText);

  // Ensure output directory exists
  mkdir(path.dirname(outputPath));

  await base
    .composite([{
      input: textBuffer,
      left: 0,
      top: 0,
      blend: 'over',
    }])
    .toFile(outputPath);
}

function getTextX(position: Corner, width: number, margin: number): number {
  switch (position) {
    case "top-left":
    case "bottom-left":
      return margin;
    case "top-right":
    case "bottom-right":
      return width - margin;
    case "center":
    default:
      return width / 2;
  }
}

function getTextY(position: Corner, height: number, margin: number, fontSize: number): number {
  switch (position) {
    case "top-left":
    case "top-right":
      return margin + fontSize;
    case "bottom-left":
    case "bottom-right":
      return height - margin;
    case "center":
    default:
      return height / 2;
  }
}

function getTextAnchor(position: Corner): string {
  switch (position) {
    case "top-left":
    case "bottom-left":
      return "start";
    case "top-right":
    case "bottom-right":
      return "end";
    case "center":
    default:
      return "middle";
  }
}

function getTextBaseline(position: Corner): string {
  switch (position) {
    case "top-left":
    case "top-right":
      return "hanging";
    case "bottom-left":
    case "bottom-right":
      return "auto";
    case "center":
    default:
      return "middle";
  }
}

const _watermark = async (file: string, targets: string[], onNode: (data: any) => void = () => { }, options: WatermarkOptions) => {
  return pMap(targets, async (target) => {
    const result = { src: file, dst: target };
    
    if (options.dry) {
      logger.debug(`Adding watermark ${file} to ${target}`);
      return result;
    }
    
    // Skip if cache is enabled and target file already exists
    if (options.cache && fs.existsSync(target)) {
      logger.debug(`Skipping ${target} - file already exists (cache enabled)`);
      return result;
    }
    
    if (options.watermarkType === 'text') {
      if (!options.text) {
        throw new Error('Text is required for text watermark');
      }
      await addTextWatermark(file, options.text, target, options.textOptions);
    } else if (options.watermarkType === 'image' && options.logoPath) {
      options.logoPath = resolve(options.logoPath, options.alt)
      if (!options.logoPath) {
        throw new Error('Logo path is required for image watermark');
      }
      if (!fs.existsSync(options.logoPath)) {
        throw new Error(`Logo file not found: ${options.logoPath}`);
      }
      await addLogoWatermark(file, options.logoPath, target, options.imageOptions);
    } else {
      throw new Error('Invalid watermark type. Must be "text" or "image"');
    }
    
    return result;
  }, { concurrency: 1 })
}

export const watermark = async (options: WatermarkOptions) => {
  // Auto-detect watermark type and setup internal options
  const watermarkContent = options.watermark;
  
  // Check if it's a file path (has file extension) or text
  const resolvedPath = resolve(watermarkContent, options.alt);
  const isFilePath = /\.(png|jpg|jpeg|svg|gif|webp)$/i.test(watermarkContent) || 
                    (resolvedPath && fs.existsSync(resolvedPath));
  
  if (isFilePath) {
    options.watermarkType = 'image';
    options.logoPath = resolvedPath;
    
    // Validate file exists
    if (!options.logoPath || !fs.existsSync(options.logoPath)) {
      throw new Error(`Watermark image file not found: ${watermarkContent}`);
    }
    
    // Setup image options
    options.imageOptions = {
      position: options.position || 'bottom-right',
      margin: options.margin || 24,
      sizePct: options.sizePct || 0.2,
      opacity: options.opacity || 0.85,
      blend: options.blend || 'over'
    };
  } else {
    options.watermarkType = 'text';
    options.text = watermarkContent;
    
    // Setup text options
    options.textOptions = {
      position: options.position || 'bottom-right',
      margin: options.margin || 24,
      fontSize: options.fontSize || 48,
      opacity: options.opacity || 0.8,
      color: options.color || '#ffffff',
      fontFamily: options.fontFamily || 'Arial',
      strokeColor: options.strokeColor || '#000000',
      strokeWidth: options.strokeWidth || 2,
    };
  }

  if (options.srcInfo) {
    logger.info(`Adding watermark to ${options.srcInfo.FILES.length} files`);
    const results = await pMap(options.srcInfo.FILES, async (f) => {
      const outputs = targets(f, options);
      return _watermark(f, outputs, () => {}, options);
    }, { concurrency: 1 });
    
    // Flatten the results array since _watermark returns an array for each file
    return results.flat();
  } else {
    options.debug && logger.error(`Invalid source info`);
    return [];
  }
}