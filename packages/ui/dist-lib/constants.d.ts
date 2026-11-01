export declare const ENABLE_ZOOM = true;
export declare enum TauriCommand {
    SUBMIT_PROMPT = "submit_prompt",
    LOG_ERROR = "log_error_to_console",
    RESOLVE_PATH = "resolve_path_relative_to_home",
    ADD_DEBUG_MESSAGE = "add_debug_message",
    SEND_IPC_MESSAGE = "send_ipc_message",
    REQUEST_CONFIG = "request_config_from_images",
    GENERATE_IMAGE = "generate_image_via_backend",
    REQUEST_FILE_DELETION = "request_file_deletion"
}
export declare enum TauriEvent {
    CONFIG_RECEIVED = "config-received",
    IMAGE_RECEIVED = "image-received",
    GENERATION_ERROR = "generation-error",
    GENERATION_COMPLETE = "generation-complete",
    FILE_DELETED_SUCCESSFULLY = "file-deleted-successfully",
    FILE_DELETION_ERROR = "file-deletion-error"
}
export declare const QUICK_STYLES: readonly ["cartoon style", "photorealistic", "noir style", "product mockup", "watercolor painting", "digital art", "minimalist design", "vintage poster", "cyberpunk aesthetic"];
export declare const QUICK_ACTIONS: readonly [{
    readonly name: "Remove Background";
    readonly prompt: "remove the background, make it transparent";
    readonly iconName: "Eraser";
}, {
    readonly name: "Cleanup";
    readonly prompt: "clean up and enhance the image, remove noise and artifacts";
    readonly iconName: "Sparkles";
}, {
    readonly name: "Crop Foreground";
    readonly prompt: "crop to focus on the main subject, remove unnecessary background";
    readonly iconName: "Crop";
}, {
    readonly name: "Improve Colors";
    readonly prompt: "enhance colors, improve saturation and contrast";
    readonly iconName: "Palette";
}, {
    readonly name: "Product Presentation";
    readonly prompt: "professional product photography style, clean background, studio lighting";
    readonly iconName: "Package";
}];
export declare const AI_IMAGE_ANALYSIS_PROMPT: "Analyze this image and provide: 1) A creative, engaging title (max 50 characters), and 2) A detailed description. Format your response with 'Title: [your title]' on the first line, followed by the description on the next lines.";
export declare const PHOTO_GRID_THUMBNAIL_WIDTH = 600;
export declare const PHOTO_GRID_IMAGE_FORMAT: "jpg";
export declare const FEED_PAGE_SIZE = 30;
export declare const FEED_API_ENDPOINT = "/api/feed";
export declare const MAX_SPLIT_PROMPTS = 10;
/**
 * Split a prompt into multiple lines for sequential generation
 * @param prompt The full prompt text
 * @param maxLines Maximum number of lines to accept (default: 10)
 * @returns Array of prompt lines, trimmed and filtered for empty lines
 */
export declare const splitPromptByLines: (prompt: string, maxLines?: number) => string[];
export interface QuickAction {
    id: string;
    name: string;
    prompt: string;
    icon: string;
}
export declare const DEFAULT_QUICK_ACTIONS: QuickAction[];
