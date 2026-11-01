import { apiClient } from "@/lib/db";

// Simple logger for user feedback
const logger = {
  debug: (message: string, data?: any) => console.debug(`[BRIA] ${message}`, data),
  info: (message: string, data?: any) => console.info(`[BRIA] ${message}`, data),
  warn: (message: string, data?: any) => console.warn(`[BRIA] ${message}`, data),
  error: (message: string, data?: any) => console.error(`[BRIA] ${message}`, data),
};

const BRIA_BASE_URL = 'https://engine.prod.bria-api.com/v1';

// Get user's Bria API key from server secrets
const getBriaApiKey = async (): Promise<string | null> => {
  try {
    const data = await apiClient<{ api_keys?: Record<string, any> }>('/api/me/secrets');
    const key = data.api_keys?.bria_api_key;
    if (!key) {
      logger.error('No Bria API key found. Please add your Bria API key in your profile settings.');
      return null;
    }
    return key;
  } catch (error) {
    logger.error('Error getting Bria API key:', error);
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

// Helper to poll for async image generation
const pollForImage = async (url: string, maxAttempts = 60, delayMs = 2000): Promise<boolean> => {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      if (response.ok && response.headers.get('content-length') !== '0') {
        return true; // Image is ready
      }
      await new Promise(resolve => setTimeout(resolve, delayMs));
    } catch (error) {
      logger.debug(`Poll attempt ${attempt + 1} failed, retrying...`);
    }
  }
  return false;
};

interface ImageResult {
  imageData: ArrayBuffer;
  text?: string;
}

/**
 * Generate image using Bria text-to-image API
 * Uses the fast endpoint with model version 3.2 for good balance of speed and quality
 */
export const createImageWithBria = async (
  prompt: string,
  model: string = 'bria-2.3-fast',
  apiKey?: string
): Promise<ImageResult | null> => {
  const key = apiKey || await getBriaApiKey();
  
  if (!key) {
    logger.error('No Bria API key found. Please provide an API key or set it in your profile.');
    return null;
  }

  try {
    logger.info('Starting Bria image generation', {
      model,
      promptLength: prompt.length,
      promptPreview: prompt.substring(0, 100) + '...'
    });

    // Parse model string to determine endpoint and version
    // Format: "bria-{version}-{speed}" e.g., "bria-3.2-fast", "bria-2.3-base", "bria-2.2-hd"
    const parts = model.split('-');
    const version = parts[1] || '3.2';
    const speed = parts[2] || 'fast'; // fast, base, or hd

    const endpoint = `${BRIA_BASE_URL}/text-to-image/${speed}/${version}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api_token': key,
      },
      body: JSON.stringify({
        prompt,
        num_results: 1,
        sync: false, // Use async for better performance
        aspect_ratio: '1:1',
        steps_num: speed === 'fast' ? 8 : 30,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Bria API error:', { status: response.status, error: errorText });
      throw new Error(`Bria API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    logger.debug('Bria API response:', data);

    // Handle response format
    if (data.error_code) {
      throw new Error(data.description || `Bria API error: ${data.error_code}`);
    }

    if (!data.result || !Array.isArray(data.result) || data.result.length === 0) {
      throw new Error('Invalid response from Bria API: no results');
    }

    const firstResult = data.result[0];
    
    // Check if result was blocked by content moderation
    if (firstResult.blocked) {
      throw new Error(firstResult.description || 'Content blocked by Bria moderation');
    }

    if (!firstResult.urls || firstResult.urls.length === 0) {
      throw new Error('No image URL in Bria response');
    }

    const imageUrl = firstResult.urls[0];
    logger.info('Image URL received from Bria:', imageUrl);

    // Poll for the image to be ready (async generation)
    logger.info('Polling for image completion...');
    const isReady = await pollForImage(imageUrl);
    
    if (!isReady) {
      throw new Error('Image generation timed out');
    }

    // Fetch the generated image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch generated image: ${imageResponse.statusText}`);
    }

    const arrayBuffer = await imageResponse.arrayBuffer();

    logger.info('Successfully generated image with Bria', {
      model,
      imageSize: arrayBuffer.byteLength,
      seed: firstResult.seed,
    });

    return {
      imageData: arrayBuffer,
      text: undefined, // Bria doesn't return text descriptions
    };

  } catch (error: any) {
    logger.error('Bria image generation failed:', {
      error: error.message,
      model,
      promptPreview: prompt.substring(0, 100) + '...'
    });
    throw error;
  }
};

/**
 * Edit image using Bria reimagine API (structure reference)
 * Maintains the structure and depth of the input while incorporating new materials, colors, and textures
 */
export const editImageWithBria = async (
  prompt: string,
  imageFiles: File[],
  model: string = 'bria-2.3-fast',
  apiKey?: string
): Promise<ImageResult | null> => {
  const key = apiKey || await getBriaApiKey();
  
  if (!key) {
    logger.error('No Bria API key found. Please provide an API key or set it in your profile.');
    return null;
  }

  try {
    logger.info('Starting Bria image editing (reimagine)', {
      model,
      imageCount: imageFiles.length,
      promptLength: prompt.length,
      promptPreview: prompt.substring(0, 100) + '...'
    });

    // Convert the first image to base64 for the structure reference
    const imageBase64 = await fileToBase64(imageFiles[0]);

    const endpoint = `${BRIA_BASE_URL}/reimagine`;

    // Parse model to determine if we should use fast mode
    const parts = model.split('-');
    const speed = parts[2] || 'fast';
    const useFast = speed === 'fast';

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api_token': key,
      },
      body: JSON.stringify({
        prompt,
        structure_image_file: imageBase64,
        structure_ref_influence: 0.75, // Good balance for maintaining structure while allowing changes
        num_results: 1,
        sync: false, // Use async for better performance
        fast: useFast,
        steps_num: useFast ? 12 : 30,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Bria API error:', { status: response.status, error: errorText });
      throw new Error(`Bria API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    logger.debug('Bria API response (reimagine):', data);

    // Handle response format
    if (data.error_code) {
      throw new Error(data.description || `Bria API error: ${data.error_code}`);
    }

    if (!data.result || !Array.isArray(data.result) || data.result.length === 0) {
      throw new Error('Invalid response from Bria API: no results');
    }

    const firstResult = data.result[0];
    
    // Check if result was blocked by content moderation
    if (firstResult.blocked) {
      throw new Error(firstResult.description || 'Content blocked by Bria moderation');
    }

    if (!firstResult.urls || firstResult.urls.length === 0) {
      throw new Error('No image URL in Bria response');
    }

    const imageUrl = firstResult.urls[0];
    logger.info('Edited image URL received from Bria:', imageUrl);

    // Poll for the image to be ready (async generation)
    logger.info('Polling for edited image completion...');
    const isReady = await pollForImage(imageUrl);
    
    if (!isReady) {
      throw new Error('Image editing timed out');
    }

    // Fetch the edited image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch edited image: ${imageResponse.statusText}`);
    }

    const arrayBuffer = await imageResponse.arrayBuffer();

    logger.info('Successfully edited image with Bria', {
      model,
      imageSize: arrayBuffer.byteLength,
      seed: firstResult.seed,
    });

    return {
      imageData: arrayBuffer,
      text: undefined,
    };

  } catch (error: any) {
    logger.error('Bria image editing failed:', {
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

