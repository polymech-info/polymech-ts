export interface IResizeOptions {
    /** FILE|FOLDER|GLOB - Source file(s) to resize */
    src: string;
    /** FILE|FOLDER|GLOB - Destination for resized files */
    dst?: string | undefined;
    /** Enable internal debug messages */
    debug?: boolean;
    /** Use alternate tokenizer, & instead of $ */
    alt?: boolean;
    /** Run without conversion */
    dry?: boolean;
    /** Show internal messages */
    verbose?: boolean;
    /** Resize image width */
    width?: number | undefined;
    /** Resize image height */
    height?: number | undefined;
    /** Resize image minimum height */
    minHeight?: number | undefined;
    /** Resize image minimum width */
    minWidth?: number | undefined;
    /** Resize image size (bytes) */
    minSize?: number | undefined;
    /** Resize image in percent (width) */
    percent?: number | undefined;
    /** Fit image within width for 1:1 aspect ratio without cropping */
    square?: boolean;
    /** Fill color for square backgrounds (default: white) */
    fillColor?: string;
    /** Log level: warn, info, debug, error */
    logLevel?: "warn" | "info" | "debug" | "error";
    /** How the image should be resized to fit both provided dimensions */
    fit?: ("cover" | "contain" | "fill" | "inside" | "outside") | undefined;
    /** Position, gravity or strategy to use when fit is cover or contain */
    position?: (number | string) | undefined;
    /** Background color when using a fit of contain */
    background?: (string | {
        r: number;
        g: number;
        b: number;
        alpha?: number | undefined;
    }) | undefined;
    /** The kernel to use for image reduction */
    kernel?: ("nearest" | "cubic" | "mitchell" | "lanczos2" | "lanczos3") | undefined;
    /** Do not enlarge if the width or height are already less than the specified dimensions */
    withoutEnlargement?: boolean;
    /** Do not reduce if the width or height are already greater than the specified dimensions */
    withoutReduction?: boolean;
    /** Take greater advantage of the JPEG and WebP shrink-on-load feature */
    fastShrinkOnLoad?: boolean;
}