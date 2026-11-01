import sharp from "sharp";
import * as path from 'path';
import * as fs from 'fs';
import pMap from 'p-map';
import { z } from 'zod';
import { logger } from '../../../index.js';
import { targets } from '../../index.js';
import { sync as mkdir } from '@polymech/fs/dir';
import { generate_interfaces, write, ZodMetaMap } from '@polymech/commons';
import { resolve } from '@polymech/commons';
// Zod Schema for watermark options
let schemaMap;
export const WatermarkOptionsSchema = (opts) => {
    schemaMap = ZodMetaMap.create();
    schemaMap.add('src', z.string()
        .min(1)
        .describe('FILE|FOLDER|GLOB - Source file(s) to add watermark to'))
        .add('dst', z.string()
        .optional()
        .describe('FILE|FOLDER|GLOB - Destination for watermarked files'))
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
        .add('watermark', z.string()
        .min(1)
        .describe('Watermark content: text string or path to image file (PNG, JPG, SVG)'))
        .add('position', z.enum(['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'])
        .default('bottom-right')
        .describe('Position of watermark'))
        .add('margin', z.number()
        .int()
        .min(0)
        .default(24)
        .describe('Margin from edges in pixels'))
        .add('opacity', z.number()
        .min(0)
        .max(1)
        .default(0.85)
        .describe('Opacity of watermark (0-1)'))
        .add('sizePct', z.number()
        .min(0)
        .max(1)
        .default(0.2)
        .describe('Size of image watermark as percentage of base image width (0-1)'))
        .add('fontSize', z.number()
        .int()
        .positive()
        .default(48)
        .describe('Font size for text watermark in pixels'))
        .add('color', z.string()
        .regex(/^#[0-9a-fA-F]{6}$/)
        .default('#ffffff')
        .describe('Text color (hex format, e.g., #ffffff)'))
        .add('fontFamily', z.string()
        .default('Arial')
        .describe('Font family for text watermark'))
        .add('strokeColor', z.string()
        .regex(/^#[0-9a-fA-F]{6}$/)
        .default('#000000')
        .describe('Text stroke color (hex format, e.g., #000000)'))
        .add('strokeWidth', z.number()
        .int()
        .min(0)
        .default(2)
        .describe('Text stroke width in pixels'));
    return schemaMap.root()
        .passthrough()
        .describe('IWatermarkOptions');
};
export const types = () => {
    generate_interfaces([WatermarkOptionsSchema()], 'src/zod_types_watermark.ts');
    schemas();
};
export const schemas = () => {
    const schema = WatermarkOptionsSchema();
    write([schema], 'schemas_watermark.json', 'watermark', {});
    // Note: schema_ui.json would need ZodMetaMap.getUISchema() implementation
    if (schemaMap && typeof schemaMap.getUISchema === 'function') {
        import('fs').then(fs => {
            fs.writeFileSync('schema_ui_watermark.json', JSON.stringify(schemaMap.getUISchema(), null, 2));
        }).catch(err => {
            console.warn('Could not write UI schema:', err.message);
        });
    }
};
export async function addLogoWatermark(inputPath, logoPath, outputPath, opts = {}) {
    const { position = "bottom-right", margin = 24, sizePct = 0.2, opacity = 0.85, blend = "over", } = opts;
    const base = sharp(inputPath);
    const { width: W = 0, height: H = 0 } = await base.metadata();
    if (!W || !H)
        throw new Error("Could not read base image size");
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
    }
    else {
        // For other image formats
        logoSharp = sharp(logoPath).resize({ width: logoWidth });
    }
    const logoBuf = await logoSharp.toBuffer();
    const { width: w = 0, height: h = 0 } = await sharp(logoBuf).metadata();
    // Compute pixel placement
    const pos = (() => {
        switch (position) {
            case "top-left": return { left: margin, top: margin };
            case "top-right": return { left: W - w - margin, top: margin };
            case "bottom-left": return { left: margin, top: H - h - margin };
            case "center": return { left: Math.round((W - w) / 2), top: Math.round((H - h) / 2) };
            case "bottom-right":
            default: return { left: W - w - margin, top: H - h - margin };
        }
    })();
    mkdir(path.dirname(outputPath));
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
export async function addTextWatermark(inputPath, text, outputPath, opts = {}) {
    const { position = "bottom-right", margin = 24, fontSize = 48, opacity = 0.8, color = '#ffffff', fontFamily = 'Arial', strokeColor = '#000000', strokeWidth = 2, } = opts;
    const base = sharp(inputPath);
    const { width: W = 0, height: H = 0 } = await base.metadata();
    if (!W || !H)
        throw new Error("Could not read base image size");
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
function getTextX(position, width, margin) {
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
function getTextY(position, height, margin, fontSize) {
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
function getTextAnchor(position) {
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
function getTextBaseline(position) {
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
const _watermark = async (file, targets, onNode = () => { }, options) => {
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
        }
        else if (options.watermarkType === 'image' && options.logoPath) {
            options.logoPath = resolve(options.logoPath, options.alt);
            if (!options.logoPath) {
                throw new Error('Logo path is required for image watermark');
            }
            if (!fs.existsSync(options.logoPath)) {
                throw new Error(`Logo file not found: ${options.logoPath}`);
            }
            await addLogoWatermark(file, options.logoPath, target, options.imageOptions);
        }
        else {
            throw new Error('Invalid watermark type. Must be "text" or "image"');
        }
        return result;
    }, { concurrency: 1 });
};
export const watermark = async (options) => {
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
    }
    else {
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
            return _watermark(f, outputs, () => { }, options);
        }, { concurrency: 1 });
        // Flatten the results array since _watermark returns an array for each file
        return results.flat();
    }
    else {
        options.debug && logger.error(`Invalid source info`);
        return [];
    }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2F0ZXJtYXJrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2xpYi9tZWRpYS9pbWFnZXMvd2F0ZXJtYXJrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sS0FBeUIsTUFBTSxPQUFPLENBQUM7QUFDOUMsT0FBTyxLQUFLLElBQUksTUFBTSxNQUFNLENBQUM7QUFDN0IsT0FBTyxLQUFLLEVBQUUsTUFBTSxJQUFJLENBQUM7QUFFekIsT0FBTyxJQUFJLE1BQU0sT0FBTyxDQUFDO0FBQ3pCLE9BQU8sRUFBRSxDQUFDLEVBQUUsTUFBTSxLQUFLLENBQUM7QUFDeEIsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLG1CQUFtQixDQUFDO0FBRTNDLE9BQU8sRUFBRSxPQUFPLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQztBQUN6QyxPQUFPLEVBQUUsSUFBSSxJQUFJLEtBQUssRUFBRSxNQUFNLGtCQUFrQixDQUFBO0FBQ2hELE9BQU8sRUFBRSxtQkFBbUIsRUFBRSxLQUFLLEVBQUUsVUFBVSxFQUFFLE1BQU0sbUJBQW1CLENBQUE7QUFFMUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxNQUFNLG1CQUFtQixDQUFBO0FBZ0QzQyxtQ0FBbUM7QUFDbkMsSUFBSSxTQUFTLENBQUE7QUFFYixNQUFNLENBQUMsTUFBTSxzQkFBc0IsR0FBRyxDQUFDLElBQVUsRUFBTyxFQUFFO0lBQ3RELFNBQVMsR0FBRyxVQUFVLENBQUMsTUFBTSxFQUFFLENBQUE7SUFFL0IsU0FBUyxDQUFDLEdBQUcsQ0FDVCxLQUFLLEVBQ0wsQ0FBQyxDQUFDLE1BQU0sRUFBRTtTQUNMLEdBQUcsQ0FBQyxDQUFDLENBQUM7U0FDTixRQUFRLENBQUMsdURBQXVELENBQUMsQ0FDekU7U0FDQSxHQUFHLENBQ0EsS0FBSyxFQUNMLENBQUMsQ0FBQyxNQUFNLEVBQUU7U0FDTCxRQUFRLEVBQUU7U0FDVixRQUFRLENBQUMsc0RBQXNELENBQUMsQ0FDeEU7U0FDQSxHQUFHLENBQ0EsT0FBTyxFQUNQLENBQUMsQ0FBQyxPQUFPLEVBQUU7U0FDTixPQUFPLENBQUMsS0FBSyxDQUFDO1NBQ2QsUUFBUSxDQUFDLGdDQUFnQyxDQUFDLENBQ2xEO1NBQ0EsR0FBRyxDQUNBLEtBQUssRUFDTCxDQUFDLENBQUMsT0FBTyxFQUFFO1NBQ04sT0FBTyxDQUFDLEtBQUssQ0FBQztTQUNkLFFBQVEsQ0FBQyx5Q0FBeUMsQ0FBQyxDQUMzRDtTQUNBLEdBQUcsQ0FDQSxLQUFLLEVBQ0wsQ0FBQyxDQUFDLE9BQU8sRUFBRTtTQUNOLE9BQU8sQ0FBQyxLQUFLLENBQUM7U0FDZCxRQUFRLENBQUMsd0JBQXdCLENBQUMsQ0FDMUM7U0FDQSxHQUFHLENBQ0EsU0FBUyxFQUNULENBQUMsQ0FBQyxPQUFPLEVBQUU7U0FDTixPQUFPLENBQUMsS0FBSyxDQUFDO1NBQ2QsUUFBUSxDQUFDLHdCQUF3QixDQUFDLENBQzFDO1NBQ0EsR0FBRyxDQUNBLFVBQVUsRUFDVixDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUM7U0FDckMsT0FBTyxDQUFDLE1BQU0sQ0FBQztTQUNmLFFBQVEsQ0FBQyxxQ0FBcUMsQ0FBQyxDQUN2RDtTQUNBLEdBQUcsQ0FDQSxPQUFPLEVBQ1AsQ0FBQyxDQUFDLE9BQU8sRUFBRTtTQUNOLE9BQU8sQ0FBQyxJQUFJLENBQUM7U0FDYixRQUFRLENBQUMsK0NBQStDLENBQUMsQ0FDakU7U0FDQSxHQUFHLENBQ0EsV0FBVyxFQUNYLENBQUMsQ0FBQyxNQUFNLEVBQUU7U0FDTCxHQUFHLENBQUMsQ0FBQyxDQUFDO1NBQ04sUUFBUSxDQUFDLHNFQUFzRSxDQUFDLENBQ3hGO1NBQ0EsR0FBRyxDQUNBLFVBQVUsRUFDVixDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsVUFBVSxFQUFFLFdBQVcsRUFBRSxhQUFhLEVBQUUsY0FBYyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1NBQ3JFLE9BQU8sQ0FBQyxjQUFjLENBQUM7U0FDdkIsUUFBUSxDQUFDLHVCQUF1QixDQUFDLENBQ3pDO1NBQ0EsR0FBRyxDQUNBLFFBQVEsRUFDUixDQUFDLENBQUMsTUFBTSxFQUFFO1NBQ0wsR0FBRyxFQUFFO1NBQ0wsR0FBRyxDQUFDLENBQUMsQ0FBQztTQUNOLE9BQU8sQ0FBQyxFQUFFLENBQUM7U0FDWCxRQUFRLENBQUMsNkJBQTZCLENBQUMsQ0FDL0M7U0FDQSxHQUFHLENBQ0EsU0FBUyxFQUNULENBQUMsQ0FBQyxNQUFNLEVBQUU7U0FDTCxHQUFHLENBQUMsQ0FBQyxDQUFDO1NBQ04sR0FBRyxDQUFDLENBQUMsQ0FBQztTQUNOLE9BQU8sQ0FBQyxJQUFJLENBQUM7U0FDYixRQUFRLENBQUMsNEJBQTRCLENBQUMsQ0FDOUM7U0FDQSxHQUFHLENBQ0EsU0FBUyxFQUNULENBQUMsQ0FBQyxNQUFNLEVBQUU7U0FDTCxHQUFHLENBQUMsQ0FBQyxDQUFDO1NBQ04sR0FBRyxDQUFDLENBQUMsQ0FBQztTQUNOLE9BQU8sQ0FBQyxHQUFHLENBQUM7U0FDWixRQUFRLENBQUMsaUVBQWlFLENBQUMsQ0FDbkY7U0FDQSxHQUFHLENBQ0EsVUFBVSxFQUNWLENBQUMsQ0FBQyxNQUFNLEVBQUU7U0FDTCxHQUFHLEVBQUU7U0FDTCxRQUFRLEVBQUU7U0FDVixPQUFPLENBQUMsRUFBRSxDQUFDO1NBQ1gsUUFBUSxDQUFDLHdDQUF3QyxDQUFDLENBQzFEO1NBQ0EsR0FBRyxDQUNBLE9BQU8sRUFDUCxDQUFDLENBQUMsTUFBTSxFQUFFO1NBQ0wsS0FBSyxDQUFDLG1CQUFtQixDQUFDO1NBQzFCLE9BQU8sQ0FBQyxTQUFTLENBQUM7U0FDbEIsUUFBUSxDQUFDLHdDQUF3QyxDQUFDLENBQzFEO1NBQ0EsR0FBRyxDQUNBLFlBQVksRUFDWixDQUFDLENBQUMsTUFBTSxFQUFFO1NBQ0wsT0FBTyxDQUFDLE9BQU8sQ0FBQztTQUNoQixRQUFRLENBQUMsZ0NBQWdDLENBQUMsQ0FDbEQ7U0FDQSxHQUFHLENBQ0EsYUFBYSxFQUNiLENBQUMsQ0FBQyxNQUFNLEVBQUU7U0FDTCxLQUFLLENBQUMsbUJBQW1CLENBQUM7U0FDMUIsT0FBTyxDQUFDLFNBQVMsQ0FBQztTQUNsQixRQUFRLENBQUMsK0NBQStDLENBQUMsQ0FDakU7U0FDQSxHQUFHLENBQ0EsYUFBYSxFQUNiLENBQUMsQ0FBQyxNQUFNLEVBQUU7U0FDTCxHQUFHLEVBQUU7U0FDTCxHQUFHLENBQUMsQ0FBQyxDQUFDO1NBQ04sT0FBTyxDQUFDLENBQUMsQ0FBQztTQUNWLFFBQVEsQ0FBQyw2QkFBNkIsQ0FBQyxDQUMvQyxDQUFBO0lBRUQsT0FBTyxTQUFTLENBQUMsSUFBSSxFQUFFO1NBQ2xCLFdBQVcsRUFBRTtTQUNiLFFBQVEsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFBO0FBQ3RDLENBQUMsQ0FBQTtBQUVELE1BQU0sQ0FBQyxNQUFNLEtBQUssR0FBRyxHQUFHLEVBQUU7SUFDdEIsbUJBQW1CLENBQUMsQ0FBQyxzQkFBc0IsRUFBRSxDQUFDLEVBQUUsNEJBQTRCLENBQUMsQ0FBQTtJQUM3RSxPQUFPLEVBQUUsQ0FBQTtBQUNiLENBQUMsQ0FBQTtBQUVELE1BQU0sQ0FBQyxNQUFNLE9BQU8sR0FBRyxHQUFHLEVBQUU7SUFDeEIsTUFBTSxNQUFNLEdBQUcsc0JBQXNCLEVBQUUsQ0FBQTtJQUN2QyxLQUFLLENBQUMsQ0FBQyxNQUFNLENBQUMsRUFBRSx3QkFBd0IsRUFBRSxXQUFXLEVBQUUsRUFBRSxDQUFDLENBQUE7SUFDMUQsMEVBQTBFO0lBQzFFLElBQUksU0FBUyxJQUFJLE9BQU8sU0FBUyxDQUFDLFdBQVcsS0FBSyxVQUFVLEVBQUUsQ0FBQztRQUMzRCxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFO1lBQ25CLEVBQUUsQ0FBQyxhQUFhLENBQUMsMEJBQTBCLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsV0FBVyxFQUFFLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUE7UUFDbEcsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFO1lBQ1gsT0FBTyxDQUFDLElBQUksQ0FBQyw0QkFBNEIsRUFBRSxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUE7UUFDM0QsQ0FBQyxDQUFDLENBQUE7SUFDTixDQUFDO0FBQ0wsQ0FBQyxDQUFBO0FBRUQsTUFBTSxDQUFDLEtBQUssVUFBVSxnQkFBZ0IsQ0FDcEMsU0FBaUIsRUFDakIsUUFBZ0IsRUFDaEIsVUFBa0IsRUFDbEIsT0FBNkIsRUFBRTtJQUUvQixNQUFNLEVBQ0osUUFBUSxHQUFHLGNBQWMsRUFDekIsTUFBTSxHQUFHLEVBQUUsRUFDWCxPQUFPLEdBQUcsR0FBRyxFQUNiLE9BQU8sR0FBRyxJQUFJLEVBQ2QsS0FBSyxHQUFHLE1BQU0sR0FDZixHQUFHLElBQUksQ0FBQztJQUVULE1BQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUM5QixNQUFNLEVBQUUsS0FBSyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsTUFBTSxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxNQUFNLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztJQUM5RCxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUFFLE1BQU0sSUFBSSxLQUFLLENBQUMsZ0NBQWdDLENBQUMsQ0FBQztJQUVoRSx1Q0FBdUM7SUFDdkMsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsT0FBTyxDQUFDLENBQUMsQ0FBQztJQUV2RCw2QkFBNkI7SUFDN0IsSUFBSSxTQUFTLENBQUM7SUFDZCxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDO0lBRXJELElBQUksT0FBTyxLQUFLLE1BQU0sRUFBRSxDQUFDO1FBQ3ZCLG9EQUFvRDtRQUNwRCxTQUFTLEdBQUcsS0FBSyxDQUFDLFFBQVEsRUFBRTtZQUMxQixPQUFPLEVBQUUsR0FBRyxDQUFDLG1DQUFtQztTQUNqRCxDQUFDLENBQUMsTUFBTSxDQUFDLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxDQUFDLENBQUM7SUFDbEMsQ0FBQztTQUFNLENBQUM7UUFDTiwwQkFBMEI7UUFDMUIsU0FBUyxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxNQUFNLENBQUMsRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLENBQUMsQ0FBQztJQUMzRCxDQUFDO0lBRUQsTUFBTSxPQUFPLEdBQUcsTUFBTSxTQUFTLENBQUMsUUFBUSxFQUFFLENBQUM7SUFDM0MsTUFBTSxFQUFFLEtBQUssRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsTUFBTSxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUM7SUFFeEUsMEJBQTBCO0lBQzFCLE1BQU0sR0FBRyxHQUFHLENBQUMsR0FBRyxFQUFFO1FBQ2hCLFFBQVEsUUFBUSxFQUFFLENBQUM7WUFDakIsS0FBSyxVQUFVLENBQUMsQ0FBSyxPQUFPLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBUSxHQUFHLEVBQUUsTUFBTSxFQUFFLENBQUM7WUFDaEUsS0FBSyxXQUFXLENBQUMsQ0FBSSxPQUFPLEVBQUUsSUFBSSxFQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsTUFBTSxFQUFFLEdBQUcsRUFBRSxNQUFNLEVBQUUsQ0FBQztZQUNsRSxLQUFLLGFBQWEsQ0FBQyxDQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFRLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLE1BQU0sRUFBRSxDQUFDO1lBQ3hFLEtBQUssUUFBUSxDQUFDLENBQU8sT0FBTyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLEdBQUcsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUM7WUFDNUYsS0FBSyxjQUFjLENBQUM7WUFDcEIsT0FBTyxDQUFDLENBQWEsT0FBTyxFQUFFLElBQUksRUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLE1BQU0sRUFBRSxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxNQUFNLEVBQUUsQ0FBQztRQUM1RSxDQUFDO0lBQ0gsQ0FBQyxDQUFDLEVBQUUsQ0FBQztJQUNMLEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUE7SUFDL0IsTUFBTSxJQUFJO1NBQ1AsU0FBUyxDQUFDLENBQUM7WUFDVixLQUFLLEVBQUUsT0FBTztZQUNkLElBQUksRUFBRSxHQUFHLENBQUMsSUFBSTtZQUNkLEdBQUcsRUFBRSxHQUFHLENBQUMsR0FBRztZQUNaLEtBQUs7WUFDTCxHQUFHLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxLQUFLLEVBQUUsVUFBVSxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztTQUM5QyxDQUFDLENBQUM7U0FDRixNQUFNLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDeEIsQ0FBQztBQUVELE1BQU0sQ0FBQyxLQUFLLFVBQVUsZ0JBQWdCLENBQ3BDLFNBQWlCLEVBQ2pCLElBQVksRUFDWixVQUFrQixFQUNsQixPQUE2QixFQUFFO0lBRS9CLE1BQU0sRUFDSixRQUFRLEdBQUcsY0FBYyxFQUN6QixNQUFNLEdBQUcsRUFBRSxFQUNYLFFBQVEsR0FBRyxFQUFFLEVBQ2IsT0FBTyxHQUFHLEdBQUcsRUFDYixLQUFLLEdBQUcsU0FBUyxFQUNqQixVQUFVLEdBQUcsT0FBTyxFQUNwQixXQUFXLEdBQUcsU0FBUyxFQUN2QixXQUFXLEdBQUcsQ0FBQyxHQUNoQixHQUFHLElBQUksQ0FBQztJQUVULE1BQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUM5QixNQUFNLEVBQUUsS0FBSyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsTUFBTSxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxNQUFNLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztJQUM5RCxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUFFLE1BQU0sSUFBSSxLQUFLLENBQUMsZ0NBQWdDLENBQUMsQ0FBQztJQUVoRSwwQkFBMEI7SUFDMUIsTUFBTSxPQUFPLEdBQUc7a0JBQ0EsQ0FBQyxhQUFhLENBQUM7O2FBRXBCLFFBQVEsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxFQUFFLE1BQU0sQ0FBQzthQUM3QixRQUFRLENBQUMsUUFBUSxFQUFFLENBQUMsRUFBRSxNQUFNLEVBQUUsUUFBUSxDQUFDO3VCQUM3QixVQUFVO3FCQUNaLFFBQVE7Z0JBQ2IsS0FBSzttQkFDRixPQUFPO2tCQUNSLFdBQVc7d0JBQ0wsV0FBVzt1QkFDWixhQUFhLENBQUMsUUFBUSxDQUFDOzZCQUNqQixlQUFlLENBQUMsUUFBUSxDQUFDOztVQUU1QyxJQUFJOzs7R0FHWCxDQUFDO0lBRUYsTUFBTSxVQUFVLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUV4QyxpQ0FBaUM7SUFDakMsS0FBSyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztJQUVoQyxNQUFNLElBQUk7U0FDUCxTQUFTLENBQUMsQ0FBQztZQUNWLEtBQUssRUFBRSxVQUFVO1lBQ2pCLElBQUksRUFBRSxDQUFDO1lBQ1AsR0FBRyxFQUFFLENBQUM7WUFDTixLQUFLLEVBQUUsTUFBTTtTQUNkLENBQUMsQ0FBQztTQUNGLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUN4QixDQUFDO0FBRUQsU0FBUyxRQUFRLENBQUMsUUFBZ0IsRUFBRSxLQUFhLEVBQUUsTUFBYztJQUMvRCxRQUFRLFFBQVEsRUFBRSxDQUFDO1FBQ2pCLEtBQUssVUFBVSxDQUFDO1FBQ2hCLEtBQUssYUFBYTtZQUNoQixPQUFPLE1BQU0sQ0FBQztRQUNoQixLQUFLLFdBQVcsQ0FBQztRQUNqQixLQUFLLGNBQWM7WUFDakIsT0FBTyxLQUFLLEdBQUcsTUFBTSxDQUFDO1FBQ3hCLEtBQUssUUFBUSxDQUFDO1FBQ2Q7WUFDRSxPQUFPLEtBQUssR0FBRyxDQUFDLENBQUM7SUFDckIsQ0FBQztBQUNILENBQUM7QUFFRCxTQUFTLFFBQVEsQ0FBQyxRQUFnQixFQUFFLE1BQWMsRUFBRSxNQUFjLEVBQUUsUUFBZ0I7SUFDbEYsUUFBUSxRQUFRLEVBQUUsQ0FBQztRQUNqQixLQUFLLFVBQVUsQ0FBQztRQUNoQixLQUFLLFdBQVc7WUFDZCxPQUFPLE1BQU0sR0FBRyxRQUFRLENBQUM7UUFDM0IsS0FBSyxhQUFhLENBQUM7UUFDbkIsS0FBSyxjQUFjO1lBQ2pCLE9BQU8sTUFBTSxHQUFHLE1BQU0sQ0FBQztRQUN6QixLQUFLLFFBQVEsQ0FBQztRQUNkO1lBQ0UsT0FBTyxNQUFNLEdBQUcsQ0FBQyxDQUFDO0lBQ3RCLENBQUM7QUFDSCxDQUFDO0FBRUQsU0FBUyxhQUFhLENBQUMsUUFBZ0I7SUFDckMsUUFBUSxRQUFRLEVBQUUsQ0FBQztRQUNqQixLQUFLLFVBQVUsQ0FBQztRQUNoQixLQUFLLGFBQWE7WUFDaEIsT0FBTyxPQUFPLENBQUM7UUFDakIsS0FBSyxXQUFXLENBQUM7UUFDakIsS0FBSyxjQUFjO1lBQ2pCLE9BQU8sS0FBSyxDQUFDO1FBQ2YsS0FBSyxRQUFRLENBQUM7UUFDZDtZQUNFLE9BQU8sUUFBUSxDQUFDO0lBQ3BCLENBQUM7QUFDSCxDQUFDO0FBRUQsU0FBUyxlQUFlLENBQUMsUUFBZ0I7SUFDdkMsUUFBUSxRQUFRLEVBQUUsQ0FBQztRQUNqQixLQUFLLFVBQVUsQ0FBQztRQUNoQixLQUFLLFdBQVc7WUFDZCxPQUFPLFNBQVMsQ0FBQztRQUNuQixLQUFLLGFBQWEsQ0FBQztRQUNuQixLQUFLLGNBQWM7WUFDakIsT0FBTyxNQUFNLENBQUM7UUFDaEIsS0FBSyxRQUFRLENBQUM7UUFDZDtZQUNFLE9BQU8sUUFBUSxDQUFDO0lBQ3BCLENBQUM7QUFDSCxDQUFDO0FBRUQsTUFBTSxVQUFVLEdBQUcsS0FBSyxFQUFFLElBQVksRUFBRSxPQUFpQixFQUFFLFNBQThCLEdBQUcsRUFBRSxHQUFHLENBQUMsRUFBRSxPQUF5QixFQUFFLEVBQUU7SUFDL0gsT0FBTyxJQUFJLENBQUMsT0FBTyxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsRUFBRTtRQUNwQyxNQUFNLE1BQU0sR0FBRyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLE1BQU0sRUFBRSxDQUFDO1FBRTFDLElBQUksT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDO1lBQ2hCLE1BQU0sQ0FBQyxLQUFLLENBQUMsb0JBQW9CLElBQUksT0FBTyxNQUFNLEVBQUUsQ0FBQyxDQUFDO1lBQ3RELE9BQU8sTUFBTSxDQUFDO1FBQ2hCLENBQUM7UUFFRCwwREFBMEQ7UUFDMUQsSUFBSSxPQUFPLENBQUMsS0FBSyxJQUFJLEVBQUUsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQztZQUMzQyxNQUFNLENBQUMsS0FBSyxDQUFDLFlBQVksTUFBTSx3Q0FBd0MsQ0FBQyxDQUFDO1lBQ3pFLE9BQU8sTUFBTSxDQUFDO1FBQ2hCLENBQUM7UUFFRCxJQUFJLE9BQU8sQ0FBQyxhQUFhLEtBQUssTUFBTSxFQUFFLENBQUM7WUFDckMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDbEIsTUFBTSxJQUFJLEtBQUssQ0FBQyxxQ0FBcUMsQ0FBQyxDQUFDO1lBQ3pELENBQUM7WUFDRCxNQUFNLGdCQUFnQixDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsSUFBSSxFQUFFLE1BQU0sRUFBRSxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDMUUsQ0FBQzthQUFNLElBQUksT0FBTyxDQUFDLGFBQWEsS0FBSyxPQUFPLElBQUksT0FBTyxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ2pFLE9BQU8sQ0FBQyxRQUFRLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFBO1lBQ3pELElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ3RCLE1BQU0sSUFBSSxLQUFLLENBQUMsMkNBQTJDLENBQUMsQ0FBQztZQUMvRCxDQUFDO1lBQ0QsSUFBSSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7Z0JBQ3JDLE1BQU0sSUFBSSxLQUFLLENBQUMsd0JBQXdCLE9BQU8sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1lBQzlELENBQUM7WUFDRCxNQUFNLGdCQUFnQixDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsUUFBUSxFQUFFLE1BQU0sRUFBRSxPQUFPLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDL0UsQ0FBQzthQUFNLENBQUM7WUFDTixNQUFNLElBQUksS0FBSyxDQUFDLG1EQUFtRCxDQUFDLENBQUM7UUFDdkUsQ0FBQztRQUVELE9BQU8sTUFBTSxDQUFDO0lBQ2hCLENBQUMsRUFBRSxFQUFFLFdBQVcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFBO0FBQ3hCLENBQUMsQ0FBQTtBQUVELE1BQU0sQ0FBQyxNQUFNLFNBQVMsR0FBRyxLQUFLLEVBQUUsT0FBeUIsRUFBRSxFQUFFO0lBQzNELHdEQUF3RDtJQUN4RCxNQUFNLGdCQUFnQixHQUFHLE9BQU8sQ0FBQyxTQUFTLENBQUM7SUFFM0MseURBQXlEO0lBQ3pELE1BQU0sWUFBWSxHQUFHLE9BQU8sQ0FBQyxnQkFBZ0IsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDNUQsTUFBTSxVQUFVLEdBQUcsaUNBQWlDLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDO1FBQ3pELENBQUMsWUFBWSxJQUFJLEVBQUUsQ0FBQyxVQUFVLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQztJQUVoRSxJQUFJLFVBQVUsRUFBRSxDQUFDO1FBQ2YsT0FBTyxDQUFDLGFBQWEsR0FBRyxPQUFPLENBQUM7UUFDaEMsT0FBTyxDQUFDLFFBQVEsR0FBRyxZQUFZLENBQUM7UUFFaEMsdUJBQXVCO1FBQ3ZCLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxJQUFJLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztZQUMxRCxNQUFNLElBQUksS0FBSyxDQUFDLG1DQUFtQyxnQkFBZ0IsRUFBRSxDQUFDLENBQUM7UUFDekUsQ0FBQztRQUVELHNCQUFzQjtRQUN0QixPQUFPLENBQUMsWUFBWSxHQUFHO1lBQ3JCLFFBQVEsRUFBRSxPQUFPLENBQUMsUUFBUSxJQUFJLGNBQWM7WUFDNUMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxNQUFNLElBQUksRUFBRTtZQUM1QixPQUFPLEVBQUUsT0FBTyxDQUFDLE9BQU8sSUFBSSxHQUFHO1lBQy9CLE9BQU8sRUFBRSxPQUFPLENBQUMsT0FBTyxJQUFJLElBQUk7WUFDaEMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxLQUFLLElBQUksTUFBTTtTQUMvQixDQUFDO0lBQ0osQ0FBQztTQUFNLENBQUM7UUFDTixPQUFPLENBQUMsYUFBYSxHQUFHLE1BQU0sQ0FBQztRQUMvQixPQUFPLENBQUMsSUFBSSxHQUFHLGdCQUFnQixDQUFDO1FBRWhDLHFCQUFxQjtRQUNyQixPQUFPLENBQUMsV0FBVyxHQUFHO1lBQ3BCLFFBQVEsRUFBRSxPQUFPLENBQUMsUUFBUSxJQUFJLGNBQWM7WUFDNUMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxNQUFNLElBQUksRUFBRTtZQUM1QixRQUFRLEVBQUUsT0FBTyxDQUFDLFFBQVEsSUFBSSxFQUFFO1lBQ2hDLE9BQU8sRUFBRSxPQUFPLENBQUMsT0FBTyxJQUFJLEdBQUc7WUFDL0IsS0FBSyxFQUFFLE9BQU8sQ0FBQyxLQUFLLElBQUksU0FBUztZQUNqQyxVQUFVLEVBQUUsT0FBTyxDQUFDLFVBQVUsSUFBSSxPQUFPO1lBQ3pDLFdBQVcsRUFBRSxPQUFPLENBQUMsV0FBVyxJQUFJLFNBQVM7WUFDN0MsV0FBVyxFQUFFLE9BQU8sQ0FBQyxXQUFXLElBQUksQ0FBQztTQUN0QyxDQUFDO0lBQ0osQ0FBQztJQUVELElBQUksT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ3BCLE1BQU0sQ0FBQyxJQUFJLENBQUMsdUJBQXVCLE9BQU8sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLE1BQU0sUUFBUSxDQUFDLENBQUM7UUFDekUsTUFBTSxPQUFPLEdBQUcsTUFBTSxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQzVELE1BQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDcEMsT0FBTyxVQUFVLENBQUMsQ0FBQyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsR0FBRSxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDbkQsQ0FBQyxFQUFFLEVBQUUsV0FBVyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7UUFFdkIsNEVBQTRFO1FBQzVFLE9BQU8sT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDO0lBQ3hCLENBQUM7U0FBTSxDQUFDO1FBQ04sT0FBTyxDQUFDLEtBQUssSUFBSSxNQUFNLENBQUMsS0FBSyxDQUFDLHFCQUFxQixDQUFDLENBQUM7UUFDckQsT0FBTyxFQUFFLENBQUM7SUFDWixDQUFDO0FBQ0gsQ0FBQyxDQUFBIn0=