export interface IWatermarkOptions {
    /** FILE|FOLDER|GLOB - Source file(s) to add watermark to */
    src: string;
    /** FILE|FOLDER|GLOB - Destination for watermarked files */
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
    /** Watermark content: text string or path to image file (PNG, JPG, SVG) */
    watermark: string;
    /** Position of watermark */
    position?: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center";
    /** Margin from edges in pixels */
    margin?: number;
    /** Opacity of watermark (0-1) */
    opacity?: number;
    /** Size of image watermark as percentage of base image width (0-1) */
    sizePct?: number;
    /** Font size for text watermark in pixels */
    fontSize?: number;
    /** Text color (hex format, e.g., #ffffff) */
    color?: string;
    /** Font family for text watermark */
    fontFamily?: string;
    /** Text stroke color (hex format, e.g., #000000) */
    strokeColor?: string;
    /** Text stroke width in pixels */
    strokeWidth?: number;
}