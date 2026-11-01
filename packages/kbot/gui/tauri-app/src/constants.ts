export const ENABLE_ZOOM = true;

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

