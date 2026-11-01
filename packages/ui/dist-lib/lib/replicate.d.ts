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
export declare const createImageWithReplicate: (prompt: string, model?: string, apiKey?: string) => Promise<ImageResult | null>;
export declare const editImageWithReplicate: (prompt: string, imageFiles: File[], model?: string, apiKey?: string) => Promise<ImageResult | null>;
export { logger };
