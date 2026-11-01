export const ENABLE_ZOOM = true;

export const SERVER_URL = 'http://localhost:3333';
export const API_URL = `${SERVER_URL}/api`;
export const OPENAPI_URL = `${SERVER_URL}/doc`;
export const THUMBNAIL_WIDTH = 800;
export const GOOGLE_MAPS_API_KEY = 'AIzaSyCHsscCXksisHKMnUihOxl2X1mKny-qrqk';


export enum TauriCommand {
  SUBMIT_PROMPT = 'submit_prompt',
  LOG_ERROR = 'log_error_to_console',
  RESOLVE_PATH = 'resolve_path_relative_to_home',
  ADD_DEBUG_MESSAGE = 'add_debug_message',
  SEND_IPC_MESSAGE = 'send_ipc_message',
  REQUEST_CONFIG = 'request_config_from_images',
  GENERATE_IMAGE = 'generate_image_via_backend',
  REQUEST_FILE_DELETION = 'request_file_deletion',
}

export enum TauriEvent {
  CONFIG_RECEIVED = 'config-received',
  IMAGE_RECEIVED = 'image-received',
  GENERATION_ERROR = 'generation-error',
  GENERATION_COMPLETE = 'generation-complete',
  FILE_DELETED_SUCCESSFULLY = 'file-deleted-successfully',
  FILE_DELETION_ERROR = 'file-deletion-error',
}

export const QUICK_STYLES = [
  'cartoon style',
  'photorealistic',
  'noir style',
  'product mockup',
  'watercolor painting',
  'digital art',
  'minimalist design',
  'vintage poster',
  'cyberpunk aesthetic'
] as const;

export const QUICK_ACTIONS = [
  {
    name: 'Remove Background',
    prompt: 'remove the background, make it transparent',
    iconName: 'Eraser'
  },
  {
    name: 'Cleanup',
    prompt: 'clean up and enhance the image, remove noise and artifacts',
    iconName: 'Sparkles'
  },
  {
    name: 'Crop Foreground',
    prompt: 'crop to focus on the main subject, remove unnecessary background',
    iconName: 'Crop'
  },
  {
    name: 'Improve Colors',
    prompt: 'enhance colors, improve saturation and contrast',
    iconName: 'Palette'
  },
  {
    name: 'Product Presentation',
    prompt: 'professional product photography style, clean background, studio lighting',
    iconName: 'Package'
  }
] as const;

// AI Image Analysis Prompt
export const AI_IMAGE_ANALYSIS_PROMPT =
  "Analyze this image and provide: 1) A creative, engaging title (max 50 characters), and 2) A detailed description. Format your response with 'Title: [your title]' on the first line, followed by the description on the next lines." as const;

// Photo Grid Image Dimensions
export const PHOTO_GRID_THUMBNAIL_WIDTH = 600;
export const PHOTO_GRID_IMAGE_FORMAT = 'jpg' as const; // 'jpg' | 'png'

// Feed Configuration
export const FEED_PAGE_SIZE = 30;
export const FEED_API_ENDPOINT = '/api/feed';

// Split Prompts Configuration
export const MAX_SPLIT_PROMPTS = 10;

/**
 * Split a prompt into multiple lines for sequential generation
 * @param prompt The full prompt text
 * @param maxLines Maximum number of lines to accept (default: 10)
 * @returns Array of prompt lines, trimmed and filtered for empty lines
 */
export const splitPromptByLines = (prompt: string, maxLines: number = MAX_SPLIT_PROMPTS): string[] => {
  return prompt
    .split('\n')
    .map(line => line.trim())
    .map(line => line.replace(/^[-•*]\s*/, '')) // Remove leading bullets/dashes
    .filter(line => line.length > 0)
    .slice(0, maxLines);
};

// Default Quick Actions for ImageWizard
export interface QuickAction {
  id: string;
  name: string;
  prompt: string;
  icon: string;
}

export const DEFAULT_QUICK_ACTIONS: QuickAction[] = [
  { id: '1', name: "Enhance", prompt: "Enhance and improve this image", icon: "✨" },
  { id: '2', name: "Make Artistic", prompt: "Transform this into a beautiful artistic painting", icon: "🎨" },
  { id: '3', name: "Cyberpunk Style", prompt: "Transform this into cyberpunk style with neon colors", icon: "🌆" },
  { id: '4', name: "Fantasy", prompt: "Transform this into a fantasy art style", icon: "🧙‍♂️" },
  { id: '5', name: "Portrait", prompt: "Transform this into a professional portrait", icon: "👤" },
];

/**
 * AI Text Generation Constants
 */
export const AI_TEXT_GEN_INSTRUCTION = `\n\nINSTRUCTIONS: Return the content formatted as Markdown. You can use code blocks, lists, and other markdown features. Do NOT include preamble or explanations. Just return the content directly.`;

export const formatTextGenPrompt = (prompt: string, context?: { selection?: string, content?: string }): string => {
  if (context?.selection) {
    return `CONTEXT:\n\`\`\`\n${context.selection}\n\`\`\`\n\nREQUEST: ${prompt}${AI_TEXT_GEN_INSTRUCTION}`;
  } else if (context?.content) {
    return `CONTEXT:\n\`\`\`\n${context.content}\n\`\`\`\n\nREQUEST: ${prompt}${AI_TEXT_GEN_INSTRUCTION}`;
  }
  return `${prompt}${AI_TEXT_GEN_INSTRUCTION}`;
};

/**
 * AI Image Generation Constants
 */
export const formatImageGenPrompt = (prompt: string, context?: string): string => {
  if (context) {
    // Truncate context if too long (arbitrary limit for prompt safety)
    const safeContext = context.slice(0, 1000);
    return `${prompt}\n\nContext: ${safeContext}`;
  }
  return prompt;
};