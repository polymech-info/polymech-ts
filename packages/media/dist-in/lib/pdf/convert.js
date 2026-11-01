import * as mupdf from 'mupdf';
import { Logger } from 'tslog';
import { z } from 'zod';
import { dirname } from 'node:path';
import { resolveVariables, pathInfoEx, generate_interfaces, write, ZodMetaMap } from '@polymech/commons';
import { sync as mkdir } from '@polymech/fs/dir';
import { writeFileSync } from 'node:fs';
import { Buffer } from 'node:buffer';
import { statSync } from "node:fs";
import { sep, resolve as pathResolve, parse as pathParse, relative as pathRelative } from "node:path";
import { readFile } from "node:fs/promises";
import { DEFAULT_ROOTS, DEFAULT_VARS } from "@polymech/commons";
export const DEFAULT_OUTPUT_TEMPLATE = "\${SRC_DIR}/\${SRC_NAME}/\${SRC_NAME}_\${PAGE}.\${FORMAT}";
// Zod Schema for PDF to JPG conversion options
let schemaMap;
export const Pdf2JpgOptionsSchema = (opts) => {
    schemaMap = ZodMetaMap.create();
    schemaMap.add('input', z.string()
        .min(1)
        .describe('Path to the input PDF file'))
        .add('output', z.string()
        .optional()
        .describe('Output path template (e.g., output/page_{PAGE}.png)'))
        .add('dpi', z.number()
        .int()
        .positive()
        .default(300)
        .describe('Resolution for the output images'))
        .add('scale', z.number()
        .positive()
        .default(2)
        .describe('Scaling factor to apply before rendering (e.g., 2 for 2x size)'))
        .add('format', z.enum(['png', 'jpg'])
        .default('jpg')
        .describe('Output image format'))
        .add('startPage', z.number()
        .int()
        .positive()
        .optional()
        .describe('First page to convert (1-based index)'))
        .add('endPage', z.number()
        .int()
        .positive()
        .optional()
        .describe('Last page to convert (1-based index)'));
    return schemaMap.root()
        .passthrough()
        .describe('IPdf2JpgOptions');
};
export const types = () => {
    generate_interfaces([Pdf2JpgOptionsSchema()], 'src/zod_types_pdf2jpg.ts');
    schemas();
};
export const schemas = () => {
    const schema = Pdf2JpgOptionsSchema();
    write([schema], 'schemas_pdf2jpg.json', 'pdf2jpg', {});
    // Note: schema_ui.json would need ZodMetaMap.getUISchema() implementation
    if (schemaMap && typeof schemaMap.getUISchema === 'function') {
        import('fs').then(fs => {
            fs.writeFileSync('schema_ui_pdf2jpg.json', JSON.stringify(schemaMap.getUISchema(), null, 2));
        }).catch(err => {
            console.warn('Could not write UI schema:', err.message);
        });
    }
};
// Helper function to convert object-like image data to Buffer
function imageDataObjectToBuffer(imageDataObject) {
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
export async function convertPdfToImages(pdfData, options) {
    const logger = options.logger || new Logger();
    const outputFiles = [];
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
            const pageVariables = {
                ...options.baseVariables,
                PAGE: pageNumber.toString()
            };
            // Resolve the output path using the template and page-specific variables
            const outputPath = await resolveVariables(options.outputPathTemplate, false, pageVariables);
            const page = doc.loadPage(i);
            // Use the scaling matrix here
            const pixmap = page.toPixmap(matrix, mupdf.ColorSpace.DeviceRGB, false);
            // Note: DPI is implicitly handled by the scaling factor now.
            // The pixmap dimensions will be scaled * scaleFactor.
            // We might want to remove the explicit DPI option later if it's confusing.
            const imageData = options.format === 'png'
                ? pixmap.asPNG()
                : pixmap.asJPEG(60, false);
            mkdir(dirname(outputPath));
            writeFileSync(outputPath, imageDataObjectToBuffer(imageData));
            outputFiles.push(outputPath);
            logger.info(`Converted page ${pageNumber} to ${outputPath}`);
        }
        return outputFiles;
    }
    catch (error) {
        logger.error('Error converting PDF to images:', error);
        throw error;
    }
}
/**
 * Runs the PDF to images conversion process.
 * Generates variables, determines output path, reads PDF, and calls the conversion engine.
 * @param config - The conversion configuration options (inferred from Zod schema).
 * @param logger - The logger instance to use for logging.
 * @returns A promise that resolves with an array of generated image file paths.
 */
export async function runConversion(config, logger) {
    const inputPath = pathResolve(config.input);
    let srcInfo = {};
    try {
        srcInfo = pathInfoEx(inputPath);
        const parsed = pathParse(inputPath);
        srcInfo = {
            ...srcInfo,
            SRC_DIR: parsed.dir,
            SRC_NAME: parsed.name,
            SRC_EXT: parsed.ext,
        };
    }
    catch (e) {
        logger.warn("pathInfoEx not found or failed, using basic path.parse");
    }
    let baseVariables = {
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
    }, {});
    // Uppercase base variable keys
    baseVariables = Object.keys(baseVariables).reduce((acc, key) => {
        acc[key.toUpperCase()] = baseVariables[key];
        return acc;
    }, {});
    baseVariables = { ...baseVariables, ...cliVars };
    let outputPathTemplate;
    let isExplicitDir = false;
    if (config.output) {
        const outputPath = pathResolve(config.output);
        try {
            const stats = statSync(outputPath);
            if (stats.isDirectory()) {
                isExplicitDir = true;
            }
        }
        catch (e) {
            if (config.output.endsWith(sep) || config.output.endsWith("/")) {
                isExplicitDir = true;
            }
            else {
                isExplicitDir = false;
            }
        }
        if (isExplicitDir) {
            baseVariables["OUT_DIR"] = outputPath;
            outputPathTemplate = "\${OUT_DIR}/\${SRC_NAME}_\${PAGE}.\${FORMAT}";
            logger.info(`Output directory specified: ${outputPath}`);
        }
        else {
            outputPathTemplate = config.output;
            logger.info(`Using output path pattern: ${outputPathTemplate}`);
        }
    }
    else {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udmVydC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9saWIvcGRmL2NvbnZlcnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxLQUFLLEtBQUssTUFBTSxPQUFPLENBQUE7QUFDOUIsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLE9BQU8sQ0FBQTtBQUM5QixPQUFPLEVBQUUsQ0FBQyxFQUFFLE1BQU0sS0FBSyxDQUFBO0FBRXZCLE9BQU8sRUFBRSxPQUFPLEVBQUUsTUFBTSxXQUFXLENBQUE7QUFDbkMsT0FBTyxFQUFFLGdCQUFnQixFQUFFLFVBQVUsRUFBRSxtQkFBbUIsRUFBRSxLQUFLLEVBQUUsVUFBVSxFQUFFLE1BQU0sbUJBQW1CLENBQUE7QUFDeEcsT0FBTyxFQUFFLElBQUksSUFBSSxLQUFLLEVBQUUsTUFBTSxrQkFBa0IsQ0FBQTtBQUNoRCxPQUFPLEVBQUUsYUFBYSxFQUFFLE1BQU0sU0FBUyxDQUFBO0FBQ3ZDLE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxhQUFhLENBQUE7QUFDcEMsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLFNBQVMsQ0FBQztBQUNuQyxPQUFPLEVBQUUsR0FBRyxFQUFFLE9BQU8sSUFBSSxXQUFXLEVBQUUsS0FBSyxJQUFJLFNBQVMsRUFBRSxRQUFRLElBQUksWUFBWSxFQUFFLE1BQU0sV0FBVyxDQUFDO0FBQ3RHLE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSxrQkFBa0IsQ0FBQztBQUM1QyxPQUFPLEVBQUUsYUFBYSxFQUFFLFlBQVksRUFBRSxNQUFNLG1CQUFtQixDQUFDO0FBRWhFLE1BQU0sQ0FBQyxNQUFNLHVCQUF1QixHQUFHLDJEQUEyRCxDQUFDO0FBRW5HLCtDQUErQztBQUMvQyxJQUFJLFNBQVMsQ0FBQTtBQUViLE1BQU0sQ0FBQyxNQUFNLG9CQUFvQixHQUFHLENBQUMsSUFBVSxFQUFPLEVBQUU7SUFDcEQsU0FBUyxHQUFHLFVBQVUsQ0FBQyxNQUFNLEVB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