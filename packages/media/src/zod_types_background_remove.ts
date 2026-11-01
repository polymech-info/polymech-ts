export interface IBackgroundRemoveOptions {
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
    /** Replicate API key (or set REPLICATE_API_TOKEN env var) */
    apiKey?: string | undefined;
    /** Background removal model to use */
    model?: string;
    /** Enable alpha matting for better edge refinement */
    alpha_matting?: boolean;
    /** Alpha matting foreground threshold */
    alpha_matting_foreground_threshold?: number;
    /** Alpha matting background threshold */
    alpha_matting_background_threshold?: number;
    /** Alpha matting erode size */
    alpha_matting_erode_size?: number;
}