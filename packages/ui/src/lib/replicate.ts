import { getAuthToken, serverUrl } from "@/lib/db";

// Simple logger for user feedback
const logger = {
  debug: (message: string, data?: any) => console.debug(`[DEBUG] ${message}`, data),
  info: (message: string, data?: any) => console.info(`[INFO] ${message}`, data),
  warn: (message: string, data?: any) => console.warn(`[WARN] ${message}`, data),
  error: (message: string, data?: any) => console.error(`[ERROR] ${message}`, data),
};

// Call the server-side Replicate proxy
const callReplicateProxy = async (model: string, input: any): Promise<any> => {
  const token = await getAuthToken();
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(`${serverUrl}/api/replicate/run`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model, input }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to call Replicate proxy');
  }

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Replicate request failed');
  }

  return result.output;
};

// Helper function to convert File to base64 data URL
const fileToDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

// Helper to fetch image and convert to data URL
const urlToDataURL = async (url: string): Promise<string> => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

interface ImageResult {
  imageData: ArrayBuffer;
  text?: string;
}

// Generate image using Replicate (text-to-image)
export const createImageWithReplicate = async (
  prompt: string,
  model: string = 'bytedance/seedream-4',
  apiKey?: string
): Promise<ImageResult | null> => {
  try {
    logger.info('Starting Replicate image generation', {
      model,
      promptLength: prompt.length,
      promptPreview: prompt.substring(0, 100) + '...'
    });

    const output = await callReplicateProxy(model, {
      prompt: prompt,
      num_inference_steps: 20,
      guidance_scale: 7.5,
    });

    logger.debug('Replicate API response:', { output });

    // Handle different output formats
    let imageUrl: string;
    
    if (Array.isArray(output) && output.length > 0) {
      imageUrl = output[0];
    } else if (typeof output === 'string') {
      imageUrl = output;
    } else if (output && typeof output === 'object' && 'url' in output) {
      imageUrl = (output as any).url;
    } else {
      logger.error('Unexpected output format from Replicate:', output);
      throw new Error('Unexpected output format from Replicate API');
    }

    logger.info('Image URL received from Replicate:', imageUrl);

    // Fetch the image and convert to ArrayBuffer
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch generated image: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();

    logger.info('Successfully generated image with Replicate', {
      model,
      imageSize: arrayBuffer.byteLength
    });

    return {
      imageData: arrayBuffer,
      text: undefined // Replicate doesn't return text descriptions
    };

  } catch (error: any) {
    logger.error('Replicate image generation failed:', {
      error: error.message,
      model,
      promptPreview: prompt.substring(0, 100) + '...'
    });
    throw error;
  }
};

// Edit image using Replicate (image-to-image)
export const editImageWithReplicate = async (
  prompt: string,
  imageFiles: File[],
  model: string = 'bytedance/seedream-4',
  apiKey?: string
): Promise<ImageResult | null> => {
  try {
    logger.info('Starting Replicate image editing', {
      model,
      imageCount: imageFiles.length,
      promptLength: prompt.length,
      promptPreview: prompt.substring(0, 100) + '...'
    });

    // Convert the first image to data URL for Replicate
    const imageDataURL = await fileToDataURL(imageFiles[0]);

    const output = await callReplicateProxy(model, {
      prompt: prompt,
      image: imageDataURL,
      num_inference_steps: 20,
      guidance_scale: 7.5,
    });

    logger.debug('Replicate API response (edit):', { output });

    // Handle different output formats
    let imageUrl: string;
    
    if (Array.isArray(output) && output.length > 0) {
      imageUrl = output[0];
    } else if (typeof output === 'string') {
      imageUrl = output;
    } else if (output && typeof output === 'object' && 'url' in output) {
      imageUrl = (output as any).url;
    } else {
      logger.error('Unexpected output format from Replicate:', output);
      throw new Error('Unexpected output format from Replicate API');
    }

    logger.info('Edited image URL received from Replicate:', imageUrl);

    // Fetch the image and convert to ArrayBuffer
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch edited image: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();

    logger.info('Successfully edited image with Replicate', {
      model,
      imageSize: arrayBuffer.byteLength
    });

    return {
      imageData: arrayBuffer,
      text: undefined
    };

  } catch (error: any) {
    logger.error('Replicate image editing failed:', {
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


