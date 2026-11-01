import { Logger } from 'tslog';
import { z } from 'zod';
import { Buffer } from 'node:buffer';
export declare const DEFAULT_OUTPUT_TEMPLATE = "${SRC_DIR}/${SRC_NAME}/${SRC_NAME}_${PAGE}.${FORMAT}";
export declare const Pdf2JpgOptionsSchema: (opts?: any) => any;
export declare const types: () => void;
export declare const schemas: () => void;
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
export declare function convertPdfToImages(pdfData: Buffer, options: PdfToImageOptions): Promise<string[]>;
export type Pdf2JpgConfig = z.infer<ReturnType<typeof Pdf2JpgOptionsSchema>>;
/**
 * Runs the PDF to images conversion process.
 * Generates variables, determines output path, reads PDF, and calls the conversion engine.
 * @param config - The conversion configuration options (inferred from Zod schema).
 * @param logger - The logger instance to use for logging.
 * @returns A promise that resolves with an array of generated image file paths.
 */
export declare function runConversion(config: Pdf2JpgConfig, logger: Logger<any>): Promise<string[]>;
