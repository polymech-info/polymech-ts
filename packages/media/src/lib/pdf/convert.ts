import * as mupdf from 'mupdf'
import { Logger } from 'tslog'
import { z } from 'zod'

import { dirname } from 'node:path'
import { resolveVariables, pathInfoEx, generate_interfaces, write, ZodMetaMap } from '@polymech/commons'
import { sync as mkdir } from '@polymech/fs/dir'
import { writeFileSync } from 'node:fs'
import { Buffer } from 'node:buffer'
import { statSync } from "node:fs";
import { sep, resolve as pathResolve, parse as pathParse, relative as pathRelative } from "node:path";
import { readFile } from "node:fs/promises";
import { DEFAULT_ROOTS, DEFAULT_VARS } from "@polymech/commons";

export const DEFAULT_OUTPUT_TEMPLATE = "\${SRC_DIR}/\${SRC_NAME}/\${SRC_NAME}_\${PAGE}.\${FORMAT}";

// Zod Schema for PDF to JPG conversion options
let schemaMap

export const Pdf2JpgOptionsSchema = (opts?: any): any => {
    schemaMap = ZodMetaMap.create()
    
    schemaMap.add(
        'input',
        z.string()
            .min(1)
            .describe('Path to the input PDF file')
    )
    .add(
        'output',
        z.string()
            .optional()
            .describe('Output path template (e.g., output/page_{PAGE}.png)')
    )
    .add(
        'dpi',
        z.number()
            .int()
            .positive()
            .default(300)
            .describe('Resolution for the output images')
    )
    .add(
        'scale',
        z.number()
            .positive()
            .default(2)
            .describe('Scaling factor to apply before rendering (e.g., 2 for 2x size)')
    )
    .add(
        'format',
        z.enum(['png', 'jpg'])
            .default('jpg')
            .describe('Output image format')
    )
    .add(
        'startPage',
        z.number()
            .int()
            .positive()
            .optional()
            .describe('First page to convert (1-based index)')
    )
    .add(
        'endPage',
        z.number()
            .int()
            .positive()
            .optional()
            .describe('Last page to convert (1-based index)')
    )

    return schemaMap.root()
        .passthrough()
        .describe('IPdf2JpgOptions')
}

export const types = () => {
    generate_interfaces([Pdf2JpgOptionsSchema()], 'src/zod_types_pdf2jpg.ts')
    schemas()
}

export const schemas = () => {
    const schema = Pdf2JpgOptionsSchema()
    write([schema], 'schemas_pdf2jpg.json', 'pdf2jpg', {})
    // Note: schema_ui.json would need ZodMetaMap.getUISchema() implementation
    if (schemaMap && typeof schemaMap.getUISchema === 'function') {
        import('fs').then(fs => {
            fs.writeFileSync('schema_ui_pdf2jpg.json', JSON.stringify(schemaMap.getUISchema(), null, 2))
        }).catch(err => {
            console.warn('Could not write UI schema:', err.message)
        })
    }
}

// Helper function to convert object-like image data to Buffer
function imageDataObjectToBuffer(imageDataObject: Record<string, number>): Buffer {
  const keys = Object.keys(imageDataObject).map(Number).sort((a, b) => a - b);
  const bufferLength = keys.length > 0 ? keys[keys.length - 1] + 1 : 0; // Determine length based on max index + 1
  const buffer = Buffer.allocUnsafe(bufferLength); // Use allocUnsafe for performance if overwriting all bytes

  for (const key in imageDataObject) {
    if (Object.prototype.hasOwnProperty.call(imageDataObject, key)) {
      const index = parseInt(key, 10);
      if (!isNaN(index) && index >= 0 && index < bufferLength) {
        buffer[index] = imageDataObject[key];
      }
    }
  }
  return buffer;
}

export type ImageFormat = 'png' | 'jpg';

export interface PdfToImageOptions {
  baseVariables: Record<string, any>;
  outputPathTemplate: string;
  dpi: number;
  scale?: number;
  format: ImageFormat;
  startPage?: number;
  endPage?: number;
  logger?: Logger<any>;
}

export async function convertPdfToImages(
  pdfData: Buffer,
  options: PdfToImageOptions
): Promise<string[]> {
  const logger = options.logger || new Logger<any>();
  const outputFiles: string[] = [];

  try {
    const doc = mupdf.Document.openDocument(pdfData, 'pdf');
    const pageCount = doc.countPages();

    // Validate and determine page range (adjusting for 0-based index)
    const start = (options.startPage ?? 1) - 1;
    const end = (options.endPage ?? pageCount) - 1;

    if (start < 0 || start >= pageCount) {
      throw new Error(`startPage (${options.startPage}) is out of valid range (1-${pageCount})`);
    }
    if (end < 0 || end >= pageCount) {
      throw new Error(`endPage (${options.endPage}) is out of valid range (1-${pageCount})`);
    }
    if (start > end) {
      // This should also be caught by Zod schema, but good to double-check
      throw new Error(`startPage (${options.startPage}) cannot be greater than endPage (${options.endPage})`);
    }

    const numPagesToProcess = end - start + 1;
    logger.info(`Processing pages ${start + 1} to ${end + 1} (${numPagesToProcess} pages) of ${pageCount} total`);

    // Determine the scaling matrix
    const scaleValue = options.scale ?? 2;
    const matrix = scaleValue === 1 ? mupdf.Matrix.identity : mupdf.Matrix.scale(scaleValue, scaleValue);

    logger.info(`Using scale factor: ${scaleValue}`);

    for (let i = start; i <= end; i++) {
      const pageNumber = i + 1; // User-facing page number (1-based)

      // Create page-specific variables
      const pageVariables: Record<string, string> = {
        ...options.baseVariables,
        PAGE: pageNumber.toString()
      };

      // Resolve the output path using the template and page-specific variables
      const outputPath = await resolveVariables(options.outputPathTemplate, false, pageVariables);

      const page = doc.loadPage(i);
      // Use the scaling matrix here
      const pixmap = page.toPixmap(
        matrix,
        mupdf.ColorSpace.DeviceRGB,
        false
      );

      // Note: DPI is implicitly handled by the scaling factor now.
      // The pixmap dimensions will be scaled * scaleFactor.
      // We might want to remove the explicit DPI option later if it's confusing.

      const imageData = options.format === 'png'
        ? pixmap.asPNG()
        : pixmap.asJPEG(60, false);

      mkdir(dirname(outputPath));
      writeFileSync(outputPath, imageDataObjectToBuffer(imageData as any))
      outputFiles.push(outputPath);
      logger.info(`Converted page ${pageNumber} to ${outputPath}`);
    }

    return outputFiles;
  } catch (error) {
    logger.error('Error converting PDF to images:', error);
    throw error;
  }
}

// Type inference from new schema
export type Pdf2JpgConfig = z.infer<ReturnType<typeof Pdf2JpgOptionsSchema>>

/**
 * Runs the PDF to images conversion process.
 * Generates variables, determines output path, reads PDF, and calls the conversion engine.
 * @param config - The conversion configuration options (inferred from Zod schema).
 * @param logger - The logger instance to use for logging.
 * @returns A promise that resolves with an array of generated image file paths.
 */
export async function runConversion(config: Pdf2JpgConfig, logger: Logger<any>): Promise<string[]> {
    const inputPath = pathResolve(config.input);
    let srcInfo: any = {};
    try {
      srcInfo = pathInfoEx(inputPath);
      const parsed = pathParse(inputPath);
      srcInfo = {
        ...srcInfo,
        SRC_DIR: parsed.dir,
        SRC_NAME: parsed.name,
        SRC_EXT: parsed.ext,
      };
    } catch (e) {
      logger.warn("pathInfoEx not found or failed, using basic path.parse");
    }

    let baseVariables: Record<string, any> = {
      ...DEFAULT_ROOTS,
      ...DEFAULT_VARS({}),
      ...srcInfo,
      DPI: config.dpi,
      FORMAT: config.format,
    };

    if (baseVariables.ROOT && baseVariables.SRC_DIR) {
        baseVariables.SRC_REL = pathRelative(baseVariables.ROOT, baseVariables.SRC_DIR);
    }

    const srcName = baseVariables.SRC_NAME || '';
    const dashed = srcName.split('-');
    if (dashed.length > 1) {
        for (let i = 0; i < dashed.length; i++) {
            baseVariables[`SRC_NAME-${i}`] = dashed[i];
        }
    }
    const dotted = srcName.split('.');
    if (dotted.length > 1) {
        for (let i = 0; i < dotted.length; i++) {
            baseVariables[`SRC_NAME.${i}`] = dotted[i];
        }
    }
    const underscored = srcName.split('_');
    if (underscored.length > 1) {
        for (let i = 0; i < underscored.length; i++) {
            baseVariables[`SRC_NAME_${i}`] = underscored[i];
        }
    }

    // Process var-* arguments directly from config object passed in
    const cliVars = Object.keys(config).filter(k => k.startsWith('var-')).reduce((acc, k) => {
        acc[k.replace('var-', '').toUpperCase()] = config[k];
        return acc;
    }, {} as Record<string, any>);

    // Uppercase base variable keys
    baseVariables = Object.keys(baseVariables).reduce((acc, key) => {
        acc[key.toUpperCase()] = baseVariables[key];
        return acc;
    }, {} as Record<string, any>);

    baseVariables = { ...baseVariables, ...cliVars };

    let outputPathTemplate: string;
    let isExplicitDir = false;

    if (config.output) {
        const outputPath = pathResolve(config.output);
        try {
            const stats = statSync(outputPath);
            if (stats.isDirectory()) {
                isExplicitDir = true;
            }
        } catch (e: any) {
            if (config.output.endsWith(sep) || config.output.endsWith("/")) {
                  isExplicitDir = true;
            } else {
                isExplicitDir = false;
            }
        }

        if (isExplicitDir) {
            baseVariables["OUT_DIR"] = outputPath;
            outputPathTemplate = "\${OUT_DIR}/\${SRC_NAME}_\${PAGE}.\${FORMAT}";
            logger.info(`Output directory specified: ${outputPath}`);
        } else {
            outputPathTemplate = config.output;
            logger.info(`Using output path pattern: ${outputPathTemplate}`);
        }

    } else {
        // Use default pattern directly from constant
        outputPathTemplate = DEFAULT_OUTPUT_TEMPLATE;
        logger.info(`Using default output path pattern: ${outputPathTemplate}`);
    }

    // --- Read PDF and Call Conversion (moved from commands/convert.ts) ---
    logger.info(`Reading PDF: ${config.input}`);
    const pdfData = await readFile(config.input);

    logger.info(`Starting conversion process...`);
    const outputFiles = await convertPdfToImages(pdfData, {
      baseVariables,
      outputPathTemplate,
      dpi: config.dpi,
      format: config.format,
      scale: config.scale,
      startPage: config.startPage,
      endPage: config.endPage,
      logger
    });

    return outputFiles;
  } 