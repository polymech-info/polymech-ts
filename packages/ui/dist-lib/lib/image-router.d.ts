/**
 * Image Generation Router
 * Routes image generation requests to the appropriate AI provider based on the model format.
 * Model format: "provider/model-name"
 *
 * Supported providers:
 * - google: Google Generative AI (Gemini models)
 * - replicate: Replicate API (various models)
 * - bria: Bria.ai (coming soon)
 */
export interface ImageResult {
    imageData: ArrayBuffer;
    text?: string;
}
export interface ModelInfo {
    provider: string;
    modelName: string;
    displayName: string;
    supportsTextToImage: boolean;
    supportsImageToImage: boolean;
}
export declare const AVAILABLE_MODELS: ModelInfo[];
/**
 * Parse model string into provider and model name
 * @param modelString Format: "provider/model-name"
 * @returns { provider, modelName }
 */
export declare const parseModelString: (modelString: string) => {
    provider: string;
    modelName: string;
};
/**
 * Get full model string from provider and model name
 */
export declare const getModelString: (provider: string, modelName: string) => string;
/**
 * Create/generate a new image from text prompt
 * Routes to the appropriate provider based on model string
 */
export declare const createImage: (prompt: string, modelString?: string, apiKey?: string, aspectRatio?: string, resolution?: string, enableSearchGrounding?: boolean) => Promise<ImageResult | null>;
/**
 * Edit an existing image with a text prompt
 * Routes to the appropriate provider based on model string
 */
export declare const editImage: (prompt: string, imageFiles: File[], modelString?: string, apiKey?: string, aspectRatio?: string, resolution?: string, enableSearchGrounding?: boolean) => Promise<ImageResult | null>;
/**
 * Get model info by model string
 */
export declare const getModelInfo: (modelString: string) => ModelInfo | undefined;
/**
 * Get all models for a specific provider
 */
export declare const getModelsByProvider: (provider: string) => ModelInfo[];
