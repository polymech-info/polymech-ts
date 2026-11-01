export interface IPdf2JpgOptions {
    /** Path to the input PDF file */
    input: string;
    /** Output path template (e.g., output/page_{PAGE}.png) */
    output?: string | undefined;
    /** Resolution for the output images */
    dpi?: number;
    /** Scaling factor to apply before rendering (e.g., 2 for 2x size) */
    scale?: number;
    /** Output image format */
    format?: "png" | "jpg";
    /** First page to convert (1-based index) */
    startPage?: number | undefined;
    /** Last page to convert (1-based index) */
    endPage?: number | undefined;
}