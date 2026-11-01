/**
 * Download an image from a URL or data URI
 */
export declare const downloadImage: (imageUrl: string, filename?: string) => Promise<void>;
/**
 * Generate a filename based on title and timestamp
 */
export declare const generateFilename: (title?: string, extension?: string) => string;
