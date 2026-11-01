import { sync as exists } from '@polymech/fs/exists';
import { sync as read } from '@polymech/fs/read';
import { sync as write } from '@polymech/fs/write';
/**
 * Appends new content to existing content.
 *
 * @param existingContent - The original content string.
 * @param newContent - The content string to append.
 * @returns The combined string with new content appended.
 */
export function concat(existingContent, newContent) {
    return existingContent + '\n\n' + newContent + '\n';
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
export function merge(existingContent, newContent) {
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
export function writeOrAppend(dstPath, content, appendMode) {
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
            }
            else if (appendMode === 'merge') {
                finalContent = merge(existingContent, content);
            }
        }
    }
    write(dstPath, finalContent);
    return finalContent;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVyZ2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvdXRpbHMvbWVyZ2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLElBQUksSUFBSSxNQUFNLEVBQUUsTUFBTSxxQkFBcUIsQ0FBQTtBQUNwRCxPQUFPLEVBQUUsSUFBSSxJQUFJLElBQUksRUFBRSxNQUFNLG1CQUFtQixDQUFBO0FBQ2hELE9BQU8sRUFBRSxJQUFJLElBQUksS0FBSyxFQUFFLE1BQU0sb0JBQW9CLENBQUE7QUFFbEQ7Ozs7OztHQU1HO0FBQ0gsTUFBTSxVQUFVLE1BQU0sQ0FBQyxlQUF1QixFQUFFLFVBQWtCO0lBQ2hFLE9BQU8sZUFBZSxHQUFHLE1BQU0sR0FBRyxVQUFVLEdBQUcsSUFBSSxDQUFBO0FBQ3JELENBQUM7QUFFRDs7Ozs7Ozs7R0FRRztBQUNILE1BQU0sVUFBVSxLQUFLLENBQUMsZUFBdUIsRUFBRSxVQUFrQjtJQUMvRCxvQ0FBb0M7SUFDcEMsaUZBQWlGO0lBQ2pGLE9BQU8sZUFBZSxHQUFHLElBQUksR0FBRyxVQUFVLENBQUM7QUFDN0MsQ0FBQztBQUVEOzs7Ozs7OztHQVFHO0FBQ0gsTUFBTSxVQUFVLGFBQWEsQ0FDM0IsT0FBZSxFQUNmLE9BQWUsRUFDZixVQUEyQztJQUUzQyxJQUFJLFVBQVUsS0FBSyxTQUFTLEVBQUUsQ0FBQztRQUM3QixLQUFLLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQ3hCLE9BQU8sT0FBTyxDQUFDO0lBQ2pCLENBQUM7SUFDRCxJQUFJLFlBQVksR0FBRyxPQUFPLENBQUM7SUFDM0IsSUFBSSxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksVUFBVSxFQUFFLENBQUM7UUFDbEMsTUFBTSxxQkFBcUIsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxrQ0FBa0M7UUFDL0UsSUFBSSxxQkFBcUIsRUFBRSxDQUFDLENBQUMsK0JBQStCO1lBQzFELE1BQU0sZUFBZSxHQUFHLHFCQUFxQixDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ3pELElBQUksVUFBVSxLQUFLLFFBQVEsRUFBRSxDQUFDO2dCQUM1QixZQUFZLEdBQUcsTUFBTSxDQUFDLGVBQWUsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUNsRCxDQUFDO2lCQUFNLElBQUksVUFBVSxLQUFLLE9BQU8sRUFBRSxDQUFDO2dCQUNsQyxZQUFZLEdBQUcsS0FBSyxDQUFDLGVBQWUsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUNqRCxDQUFDO1FBQ0gsQ0FBQztJQUNILENBQUM7SUFFRCxLQUFLLENBQUMsT0FBTyxFQUFFLFlBQVksQ0FBQyxDQUFDO0lBQzdCLE9BQU8sWUFBWSxDQUFDO0FBQ3RCLENBQUMifQ==