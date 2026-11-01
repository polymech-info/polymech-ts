export interface ImageGenerationRequest {
    prompt: string;
    width?: number;
    height?: number;
    model?: string;
}
export interface ImageGenerationResponse {
    success: boolean;
    imagePath?: string;
    imageUrl?: string;
    text?: string;
    error?: string;
}
export interface ImageEditRequest {
    imagePath: string;
    prompt: string;
    action: string;
}
interface ImageResult {
    imageData: ArrayBuffer;
    text?: string;
}
export declare const getGoogleApiKey: () => Promise<string | null>;
export declare const createImage: (prompt: string, model?: string, apiKey?: string, aspectRatio?: string, resolution?: string, enableSearchGrounding?: boolean) => Promise<ImageResult | null>;
export declare const editImage: (prompt: string, imageFiles: File[], model?: string, apiKey?: string, aspectRatio?: string, resolution?: string, enableSearchGrounding?: boolean) => Promise<ImageResult | null>;
export declare const imageApi: {
    generateImage: (request: ImageGenerationRequest) => Promise<ImageGenerationResponse>;
    editImage: (request: ImageEditRequest) => Promise<ImageGenerationResponse>;
    uploadImage: (file: File) => Promise<{
        success: boolean;
        path?: string;
        error?: string;
    }>;
    downloadImage: (url: string) => Promise<{
        success: boolean;
        path?: string;
        error?: string;
    }>;
};
export {};
