declare const logger: {
    debug: (message: string, data?: any) => void;
    info: (message: string, data?: any) => void;
    warn: (message: string, data?: any) => void;
    error: (message: string, data?: any) => void;
};
interface ImageResult {
    imageData: ArrayBuffer;
    text?: string;
}
/**
 * Generate image using Bria text-to-image API
 * Uses the fast endpoint with model version 3.2 for good balance of speed and quality
 */
export declare const createImageWithBria: (prompt: string, model?: string, apiKey?: string) => Promise<ImageResult | null>;
/**
 * Edit image using Bria reimagine API (structure reference)
 * Maintains the structure and depth of the input while incorporating new materials, colors, and textures
 */
export declare const editImageWithBria: (prompt: string, imageFiles: File[], model?: string, apiKey?: string) => Promise<ImageResult | null>;
export { logger };
