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
 * Generate image using AIML API text-to-image
 * Supports various models including ByteDance SeeDream v4, Flux, Stable Diffusion, etc.
 */
export declare const createImageWithAimlApi: (prompt: string, model?: string, apiKey?: string) => Promise<ImageResult | null>;
/**
 * Edit image using AIML API image-to-image
 * Supports models like SeeDream v4 Edit, SeedEdit 3.0, Flux i2i, etc.
 */
export declare const editImageWithAimlApi: (prompt: string, imageFiles: File[], model?: string, apiKey?: string) => Promise<ImageResult | null>;
export { logger };
