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

import { createImage as createImageGoogle, editImage as editImageGoogle } from '@/image-api';
//import { createImageWithReplicate, editImageWithReplicate } from '@/lib/replicate';
import { createImageWithBria, editImageWithBria } from '@/lib/bria';
import { createImageWithAimlApi, editImageWithAimlApi } from '@/lib/aimlapi';

// Logger for debugging
const logger = {
  debug: (message: string, data?: any) => console.debug(`[IMAGE-ROUTER] ${message}`, data),
  info: (message: string, data?: any) => console.info(`[IMAGE-ROUTER] ${message}`, data),
  warn: (message: string, data?: any) => console.warn(`[IMAGE-ROUTER] ${message}`, data),
  error: (message: string, data?: any) => console.error(`[IMAGE-ROUTER] ${message}`, data),
};

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

// Available models configuration
export const AVAILABLE_MODELS: ModelInfo[] = [
  {
    provider: 'google',
    modelName: 'gemini-3-pro-image-preview',
    displayName: 'Google Gemini 3 Pro (Image Preview)',
    supportsTextToImage: true,
    supportsImageToImage: true,
  },
  {
    provider: 'google',
    modelName: 'gemini-3.1-flash-image-preview',
    displayName: 'Google Gemini 3.1 Flash (Image Preview)',
    supportsTextToImage: true,
    supportsImageToImage: true,
  },
  /* Duplicate model name causing key conflicts - temporarily disabled
  {
    provider: 'google',
    modelName: 'gemini-3-pro-image-preview',
    displayName: 'Google Gemini 2.5 Flash (Image Preview)',
    supportsTextToImage: true,
    supportsImageToImage: true,
  },
  */
  {
    provider: 'replicate',
    modelName: 'bytedance/seedream-4',
    displayName: 'Replicate SeeDream-4 (Bytedance)',
    supportsTextToImage: true,
    supportsImageToImage: true,
  },
  {
    provider: 'bria',
    modelName: 'bria-3.2-fast',
    displayName: 'Bria.ai 3.2 Fast',
    supportsTextToImage: true,
    supportsImageToImage: true,
  },
  {
    provider: 'bria',
    modelName: 'bria-2.3-base',
    displayName: 'Bria.ai 2.3 Base (High Quality)',
    supportsTextToImage: true,
    supportsImageToImage: true,
  },
  {
    provider: 'bria',
    modelName: 'bria-2.2-hd',
    displayName: 'Bria.ai 2.2 HD (1920x1080)',
    supportsTextToImage: true,
    supportsImageToImage: false, // HD doesn't support reimagine
  },
  // AIML API - ByteDance Models
  {
    provider: 'aimlapi',
    modelName: 'bytedance/seedream-v4-text-to-image',
    displayName: 'AIML API - SeeDream v4 (4K)',
    supportsTextToImage: true,
    supportsImageToImage: false,
  },
  {
    provider: 'aimlapi',
    modelName: 'bytedance/seedream-v4-edit',
    displayName: 'AIML API - SeeDream v4 Edit (4K)',
    supportsTextToImage: false,
    supportsImageToImage: true,
  },
  {
    provider: 'aimlapi',
    modelName: 'bytedance/seededit-3.0-i2i',
    displayName: 'AIML API - SeedEdit 3.0',
    supportsTextToImage: false,
    supportsImageToImage: true,
  },
  {
    provider: 'aimlapi',
    modelName: 'bytedance/seedream-3.0',
    displayName: 'AIML API - SeeDream 3.0',
    supportsTextToImage: true,
    supportsImageToImage: false,
  },
  {
    provider: 'aimlapi',
    modelName: 'bytedance/uso',
    displayName: 'AIML API - USO (i2i)',
    supportsTextToImage: false,
    supportsImageToImage: true,
  },
  {
    provider: 'aimlapi',
    modelName: 'alibaba/qwen-image',
    displayName: 'AIML API - Qwen Image',
    supportsTextToImage: true,
    supportsImageToImage: false,
  },
  // AIML API - Flux Models
  {
    provider: 'aimlapi',
    modelName: 'flux-pro',
    displayName: 'AIML API - Flux Pro',
    supportsTextToImage: true,
    supportsImageToImage: false,
  },
  {
    provider: 'aimlapi',
    modelName: 'flux-pro/v1.1',
    displayName: 'AIML API - Flux Pro v1.1',
    supportsTextToImage: true,
    supportsImageToImage: false,
  },
  {
    provider: 'aimlapi',
    modelName: 'flux-pro/v1.1-ultra',
    displayName: 'AIML API - Flux Pro v1.1 Ultra',
    supportsTextToImage: true,
    supportsImageToImage: false,
  },
  {
    provider: 'aimlapi',
    modelName: 'flux-realism',
    displayName: 'AIML API - Flux Realism',
    supportsTextToImage: true,
    supportsImageToImage: false,
  },
  {
    provider: 'aimlapi',
    modelName: 'flux/dev',
    displayName: 'AIML API - Flux Dev',
    supportsTextToImage: true,
    supportsImageToImage: false,
  },
  {
    provider: 'aimlapi',
    modelName: 'flux/dev/image-to-image',
    displayName: 'AIML API - Flux Dev i2i',
    supportsTextToImage: false,
    supportsImageToImage: true,
  },
  {
    provider: 'aimlapi',
    modelName: 'flux/schnell',
    displayName: 'AIML API - Flux Schnell (Fast)',
    supportsTextToImage: true,
    supportsImageToImage: false,
  },
  // AIML API - Google Models
  {
    provider: 'aimlapi',
    modelName: 'imagen-3.0-generate-002',
    displayName: 'AIML API - Google Imagen 3',
    supportsTextToImage: true,
    supportsImageToImage: false,
  },
  {
    provider: 'aimlapi',
    modelName: 'google/imagen4/preview',
    displayName: 'AIML API - Google Imagen 4 Preview',
    supportsTextToImage: true,
    supportsImageToImage: false,
  },
  {
    provider: 'aimlapi',
    modelName: 'google/imagen-4.0-generate-001',
    displayName: 'AIML API - Google Imagen 4.0',
    supportsTextToImage: true,
    supportsImageToImage: false,
  },
  {
    provider: 'aimlapi',
    modelName: 'google/imagen-4.0-fast-generate-001',
    displayName: 'AIML API - Google Imagen 4.0 Fast',
    supportsTextToImage: true,
    supportsImageToImage: false,
  },
  {
    provider: 'aimlapi',
    modelName: 'google/imagen-4.0-ultra-generate-001',
    displayName: 'AIML API - Google Imagen 4.0 Ultra',
    supportsTextToImage: true,
    supportsImageToImage: false,
  },
  {
    provider: 'aimlapi',
    modelName: 'google/gemini-2.5-flash-image',
    displayName: 'AIML API - Gemini 2.5 Flash Image',
    supportsTextToImage: true,
    supportsImageToImage: false,
  },
  {
    provider: 'aimlapi',
    modelName: 'google/gemini-2.5-flash-image-edit',
    displayName: 'AIML API - Gemini 2.5 Flash Edit',
    supportsTextToImage: false,
    supportsImageToImage: true,
  },
  // AIML API - OpenAI Models
  {
    provider: 'aimlapi',
    modelName: 'dall-e-2',
    displayName: 'AIML API - DALL-E 2 (OpenAI)',
    supportsTextToImage: true,
    supportsImageToImage: false,
  },
  {
    provider: 'aimlapi',
    modelName: 'dall-e-3',
    displayName: 'AIML API - DALL-E 3 (OpenAI)',
    supportsTextToImage: true,
    supportsImageToImage: false,
  },
  // AIML API - Stability AI Models
  {
    provider: 'aimlapi',
    modelName: 'stable-diffusion-v3-medium',
    displayName: 'AIML API - Stable Diffusion 3 Medium',
    supportsTextToImage: true,
    supportsImageToImage: false,
  },
  {
    provider: 'aimlapi',
    modelName: 'stable-diffusion-v35-large',
    displayName: 'AIML API - Stable Diffusion 3.5 Large',
    supportsTextToImage: true,
    supportsImageToImage: false,
  },
  // AIML API - Recraft AI
  {
    provider: 'aimlapi',
    modelName: 'recraft-v3',
    displayName: 'AIML API - Recraft v3',
    supportsTextToImage: true,
    supportsImageToImage: false,
  },
];

/**
 * Parse model string into provider and model name
 * @param modelString Format: "provider/model-name"
 * @returns { provider, modelName }
 */
export const parseModelString = (modelString: string): { provider: string; modelName: string } => {
  const parts = modelString.split('/');

  if (parts.length < 2) {
    // Default to Google if no provider specified
    logger.warn('Model string missing provider, defaulting to Google', { modelString });
    return {
      provider: 'google',
      modelName: modelString,
    };
  }

  const provider = parts[0].toLowerCase();
  const modelName = parts.slice(1).join('/'); // Handle models with multiple slashes

  return { provider, modelName };
};

/**
 * Get full model string from provider and model name
 */
export const getModelString = (provider: string, modelName: string): string => {
  return `${provider}/${modelName}`;
};

/**
 * Create/generate a new image from text prompt
 * Routes to the appropriate provider based on model string
 */
export const createImage = async (
  prompt: string,
  modelString: string = 'google/gemini-3-pro-image-preview',
  apiKey?: string,
  aspectRatio?: string,
  resolution?: string,
  enableSearchGrounding?: boolean,
  enableImageSearch?: boolean
): Promise<ImageResult | null> => {
  const { provider, modelName } = parseModelString(modelString);

  logger.info('Routing image creation request', {
    provider,
    modelName,
    promptLength: prompt.length,
    searchGrounding: !!enableSearchGrounding,
    imageSearch: !!enableImageSearch,
  });

  try {
    switch (provider) {
      case 'google':
        return await createImageGoogle(prompt, modelName, apiKey, aspectRatio, resolution, enableSearchGrounding, enableImageSearch);

      case 'bria':
        return await createImageWithBria(prompt, modelName, apiKey);

      case 'aimlapi':
        return await createImageWithAimlApi(prompt, modelName, apiKey);

      default:
        logger.error('Unsupported provider', { provider, modelName });
        throw new Error(`Unsupported provider: ${provider}. Supported providers: google, replicate, bria, aimlapi`);
    }
  } catch (error: any) {
    logger.error('Image creation failed', {
      provider,
      modelName,
      error: error.message,
    });
    throw error;
  }
};

/**
 * Edit an existing image with a text prompt
 * Routes to the appropriate provider based on model string
 */
export const editImage = async (
  prompt: string,
  imageFiles: File[],
  modelString: string = 'google/gemini-3-pro-image-preview',
  apiKey?: string,
  aspectRatio?: string,
  resolution?: string,
  enableSearchGrounding?: boolean,
  enableImageSearch?: boolean
): Promise<ImageResult | null> => {
  const { provider, modelName } = parseModelString(modelString);

  logger.info('Routing image editing request', {
    provider,
    modelName,
    promptLength: prompt.length,
    imageCount: imageFiles.length,
    searchGrounding: !!enableSearchGrounding,
    imageSearch: !!enableImageSearch,
  });

  try {
    switch (provider) {
      case 'google':
        return await editImageGoogle(prompt, imageFiles, modelName, apiKey, aspectRatio, resolution, enableSearchGrounding, enableImageSearch);

      case 'bria':
        return await editImageWithBria(prompt, imageFiles, modelName, apiKey);

      case 'aimlapi':
        return await editImageWithAimlApi(prompt, imageFiles, modelName, apiKey);

      default:
        logger.error('Unsupported provider', { provider, modelName });
        throw new Error(`Unsupported provider: ${provider}. Supported providers: google, replicate, bria, aimlapi`);
    }
  } catch (error: any) {
    logger.error('Image editing failed', {
      provider,
      modelName,
      imageCount: imageFiles.length,
      error: error.message,
    });
    throw error;
  }
};

/**
 * Get model info by model string
 */
export const getModelInfo = (modelString: string): ModelInfo | undefined => {
  return AVAILABLE_MODELS.find(
    (m) => getModelString(m.provider, m.modelName) === modelString
  );
};

/**
 * Get all models for a specific provider
 */
export const getModelsByProvider = (provider: string): ModelInfo[] => {
  return AVAILABLE_MODELS.filter((m) => m.provider === provider);
};


