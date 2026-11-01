import { apiClient } from "@/lib/db";

// Simple logger for user feedback
const logger = {
  debug: (message: string, data?: any) => console.debug(`[AIMLAPI] ${message}`, data),
  info: (message: string, data?: any) => console.info(`[AIMLAPI] ${message}`, data),
  warn: (message: string, data?: any) => console.warn(`[AIMLAPI] ${message}`, data),
  error: (message: string, data?: any) => console.error(`[AIMLAPI] ${message}`, data),
};

const AIMLAPI_BASE_URL = 'https://api.aimlapi.com';

// Get user's AIML API key from server secrets
const getAimlApiKey = async (): Promise<string | null> => {
  try {
    const data = await apiClient<{ api_keys?: Record<string, any> }>('/api/me/secrets');
    const key = data.api_keys?.aimlapi_api_key;
    if (!key) {
      logger.error('No AIML API key found. Please add your AIML API key in your profile settings.');
      return null;
    }
    return key;
  } catch (error) {
    logger.error('Error getting AIML API key:', error);
    return null;
  }
};

// Helper function to convert File to base64
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

interface ImageResult {
  imageData: ArrayBuffer;
  text?: string;
}

/**
 * Generate image using AIML API text-to-image
 * Supports various models including ByteDance SeeDream v4, Flux, Stable Diffusion, etc.
 */
export const createImageWithAimlApi = async (
  prompt: string,
  model: string = 'bytedance/seedream-v4',
  apiKey?: string
): Promise<ImageResult | null> => {
  const key = apiKey || await getAimlApiKey();

  if (!key) {
    logger.error('No AIML API key found. Please provide an API key or set it in your profile.');
    return null;
  }

  try {
    logger.info('Starting AIML API image generation', {
      model,
      promptLength: prompt.length,
      promptPreview: prompt.substring(0, 100) + '...'
    });

    const endpoint = `${AIMLAPI_BASE_URL}/v1/images/generations`;

    // Build request body based on model requirements
    const requestBody: any = {
      model,
      prompt,
    };

    // Most models support these common parameters
    if (!model.includes('dall-e')) {
      requestBody.image_size = { width: 1024, height: 1024 };
      requestBody.num_images = 1;
      requestBody.sync_mode = true;
    } else {
      // DALL-E uses different parameters
      requestBody.n = 1;
      requestBody.size = '1024x1024';
    }

    logger.debug('AIML API request body:', requestBody);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('AIML API error:', { status: response.status, error: errorText });
      throw new Error(`AIML API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    logger.debug('AIML API response:', data);

    // Handle response format: { data: [{ url: "...", b64_json: "..." }] }
    if (!data.data || !Array.isArray(data.data) || data.data.length === 0) {
      throw new Error('Invalid response from AIML API: no image data');
    }

    const firstResult = data.data[0];

    // Prefer URL over base64 if both are provided
    let arrayBuffer: ArrayBuffer;

    if (firstResult.url) {
      logger.info('Image URL received from AIML API:', firstResult.url);

      // Fetch the image from URL
      const imageResponse = await fetch(firstResult.url);
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch generated image: ${imageResponse.statusText}`);
      }
      arrayBuffer = await imageResponse.arrayBuffer();
    } else if (firstResult.b64_json) {
      logger.info('Base64 image received from AIML API');

      // Convert base64 to ArrayBuffer
      const binaryString = atob(firstResult.b64_json);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      arrayBuffer = bytes.buffer;
    } else {
      throw new Error('No image URL or base64 data in AIML API response');
    }

    logger.info('Successfully generated image with AIML API', {
      model,
      imageSize: arrayBuffer.byteLength,
    });

    return {
      imageData: arrayBuffer,
      text: undefined, // AIML API doesn't return text descriptions
    };

  } catch (error: any) {
    logger.error('AIML API image generation failed:', {
      error: error.message,
      model,
      promptPreview: prompt.substring(0, 100) + '...'
    });
    throw error;
  }
};

/**
 * Edit image using AIML API image-to-image
 * Supports models like SeeDream v4 Edit, SeedEdit 3.0, Flux i2i, etc.
 */
export const editImageWithAimlApi = async (
  prompt: string,
  imageFiles: File[],
  model: string = 'bytedance/seedream-v4-edit',
  apiKey?: string
): Promise<ImageResult | null> => {
  const key = apiKey || await getAimlApiKey();

  if (!key) {
    logger.error('No AIML API key found. Please provide an API key or set it in your profile.');
    return null;
  }

  try {
    logger.info('Starting AIML API image editing', {
      model,
      imageCount: imageFiles.length,
      promptLength: prompt.length,
      promptPreview: prompt.substring(0, 100) + '...'
    });

    // Convert the first image to base64
    const imageBase64 = await fileToBase64(imageFiles[0]);

    const endpoint = `${AIMLAPI_BASE_URL}/v1/images/generations`;

    // Different models use different parameter names for the image
    const requestBody: any = {
      model,
      prompt,
      num_images: 1,
      sync_mode: true,
    };

    // AIML API edit endpoint requires image_urls for all models
    requestBody.image_urls = [`data:image/png;base64,${imageBase64}`];

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('AIML API error:', { status: response.status, error: errorText });
      throw new Error(`AIML API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    logger.debug('AIML API response (edit):', data);

    // Handle response format
    if (!data.data || !Array.isArray(data.data) || data.data.length === 0) {
      throw new Error('Invalid response from AIML API: no image data');
    }

    const firstResult = data.data[0];

    // Prefer URL over base64 if both are provided
    let arrayBuffer: ArrayBuffer;

    if (firstResult.url) {
      logger.info('Edited image URL received from AIML API:', firstResult.url);

      // Fetch the image from URL
      const imageResponse = await fetch(firstResult.url);
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch edited image: ${imageResponse.statusText}`);
      }
      arrayBuffer = await imageResponse.arrayBuffer();
    } else if (firstResult.b64_json) {
      logger.info('Base64 edited image received from AIML API');

      // Convert base64 to ArrayBuffer
      const binaryString = atob(firstResult.b64_json);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      arrayBuffer = bytes.buffer;
    } else {
      throw new Error('No image URL or base64 data in AIML API response');
    }

    logger.info('Successfully edited image with AIML API', {
      model,
      imageSize: arrayBuffer.byteLength,
    });

    return {
      imageData: arrayBuffer,
      text: undefined,
    };

  } catch (error: any) {
    logger.error('AIML API image editing failed:', {
      error: error.message,
      model,
      imageCount: imageFiles.length,
      promptPreview: prompt.substring(0, 100) + '...'
    });
    throw error;
  }
};

// Export the logger for consistency
export { logger };

