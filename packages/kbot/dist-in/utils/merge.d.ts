/**
 * Appends new content to existing content.
 *
 * @param existingContent - The original content string.
 * @param newContent - The content string to append.
 * @returns The combined string with new content appended.
 */
export declare function concat(existingContent: string, newContent: string): string;
/**
 * Merges new content into existing content.
 * For now, this simply concatenates with a newline separator.
 * TODO: Implement more sophisticated merging logic if needed (e.g., JSON merge).
 *
 * @param existingContent - The original content string.
 * @param newContent - The content string to merge/append.
 * @returns The combined string.
 */
export declare function merge(existingContent: string, newContent: string): string;
/**
 * Writes content to a destination file, handling append/merge logic if the file exists.
 *
 * @param dstPath - The absolute path to the destination file.
 * @param content - The content to write.
 * @param appendMode - Optional mode ('concat' or 'merge') to handle existing files.
 * @param logger - Optional logger instance conforming to SimpleLogger.
 * @returns The final content written to the file or the original content if read fails.
 */
export declare function writeOrAppend(dstPath: string, content: string, appendMode?: 'concat' | 'merge' | 'replace'): string;
