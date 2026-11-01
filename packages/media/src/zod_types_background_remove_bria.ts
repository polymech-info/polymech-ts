export interface IBriaBackgroundRemoveOptions {
    /** FILE|FOLDER|GLOB - Source file(s) to remove background from */
    src: string;
    /** FILE|FOLDER|GLOB - Destination for processed files */
    dst?: string | undefined;
    /** Enable internal debug messages */
    debug?: boolean;
    /** Use alternate tokenizer, & instead of $ */
    alt?: boolean;
    /** Run without conversion */
    dry?: boolean;
    /** Show internal messages */
    verbose?: boolean;
    /** Log level: warn, info, debug, error */
    logLevel?: "warn" | "info" | "debug" | "error";
    /** Skip processing if target file already exists */
    cache?: boolean;
    /** Bria API key (or set in config.bria.key) */
    apiKey?: string | undefined;
    /** Use synchronous processing (recommended) */
    sync?: boolean;
    /** Enable content moderation */
    contentModeration?: boolean;
    /** Preserve alpha channel from input image */
    preserveAlpha?: boolean;
    /** Convert PNG output to JPG format and delete PNG */
    jpg?: boolean;
}