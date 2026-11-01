import { GoogleGenerativeAI, Part, GenerationConfig } from "@google/generative-ai";
import { userManager } from "@/lib/oidc";
import { getUserGoogleApiKey } from "./modules/user/client-user";

// Simple logger for user feedback (safety messages)
const logger = {
  debug: (message: string, data?: any) => console.debug(`[DEBUG] ${message}`, data),
  info: (message: string, data?: any) => console.info(`[INFO] ${message}`, data),
  warn: (message: string, data?: any) => console.warn(`[WARN] ${message}`, data),
  error: (message: string, data?: any) => console.error(`[ERROR] ${message}`, data),
};

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
  text?: string; // Add text field for AI descriptions
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

// Get user's Google API key from user_secrets
export const getGoogleApiKey = async (): Promise<string | null> => {
  try {
    const oidcUser = await userManager.getUser();
    const userId = oidcUser?.profile.sub
      ? (process.env.VITE_ZITADEL_ADMIN_UUID || oidcUser.profile.sub)
      : null;
    if (!userId) {
      logger.error('No authenticated user found');
      return null;
    }

    const apiKey = await getUserGoogleApiKey(userId);

    if (!apiKey) {
      logger.error('No Google API key found in user secrets. Please add your Google API key in your profile settings.');
      return null;
    }

    return apiKey;
  } catch (error) {
    logger.error('Error getting Google API key:', error);
    return null;
  }
};


// Create Google GenAI client
const createGoogleGenAIClient = async (apiKey?: string) => {
  const key = apiKey || await getGoogleApiKey();

  if (!key) {
    logger.error('No Google API key found. Please provide an API key or set it in your profile.');
    return null;
  }

  return new GoogleGenerativeAI(key);
};

// Helper to get MIME type from file extension
const getMimeType = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase();
  const mimeTypes: { [key: string]: string } = {
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'webp': 'image/webp',
    'gif': 'image/gif'
  };
  return mimeTypes[ext || ''] || 'image/png';
};

// Helper to convert File to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix to get just the base64 string
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};

export const createImage = async (
  prompt: string,
  model: string = 'gemini-3-pro-image-preview',
  apiKey?: string,
  aspectRatio?: string,
  resolution?: string,
  enableSearchGrounding?: boolean,
  enableImageSearch?: boolean
): Promise<ImageResult | null> => {
  const ai = await createGoogleGenAIClient(apiKey);
  if (!ai) {
    return null;
  }

  // Build search tools config
  let searchTools: any[] | undefined;
  if (enableSearchGrounding) {
    if (enableImageSearch) {
      // New searchTypes-based grounding (supports image search)
      searchTools = [{ google_search: { search_types: { web_search: {}, image_search: {} } } }];
    } else {
      searchTools = [{ 'google_search': {} }];
    }
  }

  const genModel = ai.getGenerativeModel({
    model,
    // @ts-ignore - tools is not in the version of the SDK used, but are supported by the API
    tools: searchTools,
  });

  const generationConfig: GenerationConfig = {};
  if (aspectRatio || resolution) {
    // @ts-ignore - imageConfig and imageSize are not in the version of the SDK used, but are supported by the API
    generationConfig.imageConfig = {};
    if (aspectRatio) {
      // @ts-ignore
      generationConfig.imageConfig.aspectRatio = aspectRatio;
    }
    if (resolution) {
      // @ts-ignore
      generationConfig.imageConfig.imageSize = resolution;
    }
  }

  try {
    let result;
    if (Object.keys(generationConfig).length > 0) {
      // @ts-ignore
      result = await genModel.generateContent(prompt, generationConfig);
    } else {
      result = await genModel.generateContent(prompt);
    }

    const response = result.response;
    logger.debug('Google AI API response structure:', {
      hasResponse: !!response,
      hasCandidates: !!response?.candidates,
      candidatesLength: response?.candidates?.length,
    });

    if (!response || !response.candidates || response.candidates.length === 0) {
      logger.error('Invalid API response structure - no candidates found');
      throw new Error('No candidates returned from Google AI API. The content may have been blocked due to safety filters or other restrictions.');
    }

    const candidate = response.candidates[0];

    // Check for safety filter rejections first
    if (candidate.finishReason && candidate.finishReason !== 'STOP') {
      const finishReasonMessages: { [key: string]: string } = {
        'SAFETY': 'Content blocked by safety filters. The prompt contains content that violates Google AI safety policies.',
        'RECITATION': 'Content blocked due to recitation concerns. The generated content may be too similar to existing copyrighted material.',
        'OTHER': 'Content generation stopped for other safety or policy reasons.'
      };

      const message = finishReasonMessages[candidate.finishReason] ||
        `Content generation stopped. Reason: ${candidate.finishReason}`;

      logger.error('Google AI blocked content due to safety filters:', {
        finishReason: candidate.finishReason,
        rejectionMessage: message,
      });
      throw new Error(`Request blocked by Google AI: ${message}`);
    }

    if (!candidate.content || !candidate.content.parts) {
      logger.error('Invalid candidate structure - no content parts found');
      throw new Error('Invalid response structure from Google AI API - no content parts found.');
    }

    const parts = candidate.content.parts;

    let imageData: ArrayBuffer | null = null;
    let aiText: string | null = null;

    // Extract both image data and text from all parts
    for (const part of parts) {
      if ('inlineData' in part && part.inlineData) {
        // Convert base64 to ArrayBuffer
        const binaryString = atob(part.inlineData.data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        imageData = bytes.buffer;
      } else if ('text' in part && part.text) {
        // Collect text descriptions
        if (!aiText) {
          aiText = part.text.trim();
        } else {
          aiText += ' ' + part.text.trim();
        }
      }
    }

    if (imageData) {
      logger.info('Successfully found image data in response', {
        hasText: !!aiText,
        textPreview: aiText?.substring(0, 100)
      });
      return { imageData, text: aiText || undefined };
    }

    // Only if no image data found, check for text responses to provide helpful error
    if (aiText) {
      logger.info('Google AI returned text response instead of image:', {
        textResponse: aiText,
        finishReason: candidate.finishReason
      });
      throw new Error(`Google AI returned text instead of image: ${aiText}`);
    }

    logger.warn('No image data found in API response parts');
    throw new Error('No image data found in API response. The model may not have generated an image.');

  } catch (error: any) {
    logger.error('Google AI API error in createImage:', {
      error: error.message,
      prompt: prompt.substring(0, 100) + '...'
    });
    throw error;
  }
};

export const editImage = async (
  prompt: string,
  imageFiles: File[],
  model: string = 'gemini-3-pro-image-preview',
  apiKey?: string,
  aspectRatio?: string,
  resolution?: string,
  enableSearchGrounding?: boolean,
  enableImageSearch?: boolean
): Promise<ImageResult | null> => {
  const ai = await createGoogleGenAIClient(apiKey);
  if (!ai) {
    return null;
  }

  // Build search tools config
  let searchTools: any[] | undefined;
  if (enableSearchGrounding) {
    if (enableImageSearch) {
      searchTools = [{ google_search: { search_types: { web_search: {}, image_search: {} } } }];
    } else {
      searchTools = [{ 'google_search': {} }];
    }
  }

  const genModel = ai.getGenerativeModel({
    model,
    // @ts-ignore
    tools: searchTools,
  });

  try {
    const imageParts: Part[] = await Promise.all(imageFiles.map(async (file) => {
      const base64Data = await fileToBase64(file);
      const mimeType = getMimeType(file.name);
      return {
        inlineData: {
          mimeType,
          data: base64Data,
        },
      };
    }));

    const textPart: Part = { text: prompt };
    const promptParts = [...imageParts, textPart];

    const generationConfig: GenerationConfig = {};
    if (aspectRatio || resolution) {
      // @ts-ignore
      generationConfig.imageConfig = {};
      if (aspectRatio) {
        // @ts-ignore
        generationConfig.imageConfig.aspectRatio = aspectRatio;
      }
      if (resolution) {
        // @ts-ignore
        generationConfig.imageConfig.imageSize = resolution;
      }
    }

    let result;
    if (Object.keys(generationConfig).length > 0) {
      // @ts-ignore
      result = await genModel.generateContent(promptParts, generationConfig);
    } else {
      result = await genModel.generateContent(promptParts);
    }

    const response = result.response;
    logger.debug('Google AI API response structure (editImage):', {
      hasResponse: !!response,
      hasCandidates: !!response?.candidates,
      candidatesLength: response?.candidates?.length,
    });

    if (!response || !response.candidates || response.candidates.length === 0) {
      logger.error('Invalid API response structure - no candidates found (editImage)');
      throw new Error('No candidates returned from Google AI API. The content may have been blocked due to safety filters or other restrictions.');
    }

    const candidate = response.candidates[0];

    // Check for safety filter rejections first
    if (candidate.finishReason && candidate.finishReason !== 'STOP') {
      const finishReasonMessages: { [key: string]: string } = {
        'SAFETY': 'Content blocked by safety filters. The prompt contains content that violates Google AI safety policies.',
        'RECITATION': 'Content blocked due to recitation concerns. The generated content may be too similar to existing copyrighted material.',
        'OTHER': 'Content generation stopped for other safety or policy reasons.'
      };

      const message = finishReasonMessages[candidate.finishReason] ||
        `Content generation stopped. Reason: ${candidate.finishReason}`;

      logger.error('Google AI blocked image edit due to safety filters:', {
        finishReason: candidate.finishReason,
        rejectionMessage: message,
      });
      throw new Error(`Request blocked by Google AI: ${message}`);
    }

    if (!candidate.content || !candidate.content.parts) {
      logger.error('Invalid candidate structure - no content parts found (editImage)');
      throw new Error('Invalid response structure from Google AI API - no content parts found.');
    }

    const parts = candidate.content.parts;

    let imageData: ArrayBuffer | null = null;
    let aiText: string | null = null;

    // Extract both image data and text from all parts
    for (const part of parts) {
      if ('inlineData' in part && part.inlineData) {
        // Convert base64 to ArrayBuffer
        const binaryString = atob(part.inlineData.data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        imageData = bytes.buffer;
      } else if ('text' in part && part.text) {
        // Collect text descriptions
        if (!aiText) {
          aiText = part.text.trim();
        } else {
          aiText += ' ' + part.text.trim();
        }
      }
    }

    if (imageData) {
      logger.info('Successfully found image data in editImage response', {
        hasText: !!aiText,
        textPreview: aiText?.substring(0, 100)
      });
      return { imageData, text: aiText || undefined };
    }

    // Only if no image data found, check for text responses to provide helpful error
    if (aiText) {
      logger.info('Google AI returned text response instead of image (editImage):', {
        textResponse: aiText,
        finishReason: candidate.finishReason
      });
      throw new Error(`Google AI returned text instead of image: ${aiText}`);
    }

    logger.warn('No image data found in API response parts (editImage)');
    throw new Error('No image data found in API response. The model may not have generated an image.');

  } catch (error: any) {
    logger.error('Google AI API error in editImage:', {
      error: error.message,
      prompt: prompt.substring(0, 100) + '...',
      imageCount: imageFiles.length,
    });
    throw error;
  }
};

export const imageApi = {
  // Generate new image from text prompt
  generateImage: async (request: ImageGenerationRequest): Promise<ImageGenerationResponse> => {
    console.log('🎨 Generate image:', request);

    try {
      const imageBuffer = await createImage(request.prompt, request.model);
      if (!imageBuffer) {
        return {
          success: false,
          error: 'Failed to generate image - no Google API key found'
        };
      }

      // Convert ArrayBuffer to blob URL for display
      const uint8Array = new Uint8Array(imageBuffer.imageData);
      const blob = new Blob([uint8Array], { type: 'image/png' });
      const imageUrl = URL.createObjectURL(blob);

      return {
        success: true,
        imagePath: `generated_${Date.now()}.png`,
        imageUrl,
        text: imageBuffer.text
      };
    } catch (error: any) {
      logger.error('Image generation failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to generate image'
      };
    }
  },

  // Edit existing image with prompt
  editImage: async (request: ImageEditRequest): Promise<ImageGenerationResponse> => {
    console.log('✏️ Edit image:', request);

    try {
      // For now, we'll need to get the image file from the path
      // This would need to be adapted based on how images are stored
      console.warn('Image editing requires File objects - this needs to be called with actual File objects');

      return {
        success: false,
        error: 'Image editing requires File objects - please use the editImage function directly'
      };
    } catch (error: any) {
      logger.error('Image editing failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to edit image'
      };
    }
  },

  // Upload image file
  uploadImage: async (file: File): Promise<{ success: boolean; path?: string; error?: string }> => {
    console.log('📤 Upload image:', file.name);

    return {
      success: true,
      path: `uploaded_${Date.now()}_${file.name}`
    };
  },

  // Get image from URL
  downloadImage: async (url: string): Promise<{ success: boolean; path?: string; error?: string }> => {
    console.log('📥 Download image from URL:', url);

    return {
      success: true,
      path: `downloaded_${Date.now()}.png`
    };
  }
};