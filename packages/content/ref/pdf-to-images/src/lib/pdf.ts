import * as mupdf from 'mupdf'
import { Logger } from 'tslog'
import { writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { resolveVariables, pathInfoEx } from '@polymech/commons'
import { sync as write } from '@polymech/fs/write'
import { sync as mkdir } from '@polymech/fs/dir'
import { writeFileSync } from 'node:fs'
import { Buffer } from 'node:buffer'

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

