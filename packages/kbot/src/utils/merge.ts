import { sync as exists } from '@polymech/fs/exists'
import { sync as read } from '@polymech/fs/read'
import { sync as write } from '@polymech/fs/write'

/**
 * Appends new content to existing content.
 *
 * @param existingContent - The original content string.
 * @param newContent - The content string to append.
 * @returns The combined string with new content appended.
 */
export function concat(existingContent: string, newContent: string): string {
  return existingContent + '\n\n' + newContent + '\n'
}

/**
 * Merges new content into existing content.
 * For now, this simply concatenates with a newline separator.
 * TODO: Implement more sophisticated merging logic if needed (e.g., JSON merge).
 *
 * @param existingContent - The original content string.
 * @param newContent - The content string to merge/append.
 * @returns The combined string.
 */
export function merge(existingContent: string, newContent: string): string {
  // Placeholder: Simple concatenation
  // Potential future implementation: Detect JSON/YAML and perform structured merge
  return existingContent + '\n' + newContent;
}

/**
 * Writes content to a destination file, handling append/merge logic if the file exists.
 *
 * @param dstPath - The absolute path to the destination file.
 * @param content - The content to write.
 * @param appendMode - Optional mode ('concat' or 'merge') to handle existing files.
 * @param logger - Optional logger instance conforming to SimpleLogger.
 * @returns The final content written to the file or the original content if read fails.
 */
export function writeOrAppend(
  dstPath: string,
  content: string,
  appendMode?: 'concat' | 'merge' | 'replace'
): string {
  if (appendMode === 'replace') {
    write(dstPath, content);
    return content;
  }
  let finalContent = content;
  if (exists(dstPath) && appendMode) {
    const existingContentBuffer = read(dstPath); // Read returns Buffer | undefined
    if (existingContentBuffer) { // Check if read was successful
      const existingContent = existingContentBuffer.toString();
      if (appendMode === 'concat') {
        finalContent = concat(existingContent, content);
      } else if (appendMode === 'merge') {
        finalContent = merge(existingContent, content);
      }
    }
  }

  write(dstPath, finalContent);
  return finalContent;
} 