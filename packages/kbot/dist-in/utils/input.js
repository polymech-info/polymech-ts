import * as path from 'node:path';
import { sync as exists } from '@polymech/fs/exists';
import { sync as read } from '@polymech/fs/read';
import { resolve, isFile } from '@polymech/commons';
import { detectAndHandle } from '../commands/handlers/index.js';
import { logger } from '../index.js';
export const readStdin = async (timeoutMs = 100) => {
    return new Promise((resolve, reject) => {
        const chunks = [];
        if (process.stdin.isTTY) {
            resolve(Buffer.from(''));
            return;
        }
        const onData = (chunk) => {
            chunks.push(Buffer.from(chunk));
        };
        // Handle end of stdin
        const onEnd = () => {
            cleanup();
            resolve(Buffer.concat(chunks));
        };
        const onError = (err) => {
            cleanup();
            reject(err);
        };
        const onTimeout = () => {
            cleanup();
            resolve(Buffer.concat(chunks)); // Resolve with whatever has been read so far
        };
        // Cleanup listeners and timeout
        const cleanup = () => {
            process.stdin.removeListener('data', onData);
            process.stdin.removeListener('end', onEnd);
            process.stdin.removeListener('error', onError);
            clearTimeout(timeout);
        };
        // Attach event listeners
        process.stdin.on('data', onData);
        process.stdin.on('end', onEnd);
        process.stdin.on('error', onError);
        // Start the timeout
        const timeout = setTimeout(onTimeout, timeoutMs);
        // Ensure the stdin stream is flowing
        process.stdin.resume();
    });
};
export const resolveQuery = async (options) => {
    const stdinContent = await readStdin();
    if (stdinContent.length > 0) {
        try {
            return await detectAndHandle(stdinContent, options);
        }
        catch (error) {
            logger.error('Failed to process stdin content:', error.message);
            throw error;
        }
    }
    if (options.prompt) {
        const queryPath = options.prompt.length < 4096
            ? path.resolve(resolve(options.prompt, options.alt)) || ''
            : '';
        if (queryPath && exists(queryPath) && isFile(queryPath)) {
            const fileContent = read(queryPath, 'buffer');
            try {
                return await detectAndHandle(fileContent, options);
            }
            catch (error) {
                logger.error(`Failed to process file ${queryPath}:`, error.message);
                throw error;
            }
        }
        // 3. Return direct prompt string
        return options.prompt;
    }
    return "";
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5wdXQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvdXRpbHMvaW5wdXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxLQUFLLElBQUksTUFBTSxXQUFXLENBQUE7QUFDakMsT0FBTyxFQUFFLElBQUksSUFBSSxNQUFNLEVBQUUsTUFBTSxxQkFBcUIsQ0FBQTtBQUNwRCxPQUFPLEVBQUUsSUFBSSxJQUFJLElBQUksRUFBRSxNQUFNLG1CQUFtQixDQUFBO0FBQ2hELE9BQU8sRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sbUJBQW1CLENBQUE7QUFFbkQsT0FBTyxFQUFFLGVBQWUsRUFBRSxNQUFNLCtCQUErQixDQUFBO0FBQy9ELE9BQU8sRUFBRSxNQUFNLEVBQUcsTUFBTSxhQUFhLENBQUE7QUFHckMsTUFBTSxDQUFDLE1BQU0sU0FBUyxHQUFHLEtBQUssRUFBRSxZQUFvQixHQUFHLEVBQW1CLEVBQUU7SUFDMUUsT0FBTyxJQUFJLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtRQUNyQyxNQUFNLE1BQU0sR0FBYSxFQUFFLENBQUM7UUFDNUIsSUFBSSxPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ3hCLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDekIsT0FBTztRQUNULENBQUM7UUFFRCxNQUFNLE1BQU0sR0FBRyxDQUFDLEtBQWEsRUFBRSxFQUFFO1lBQy9CLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQ2xDLENBQUMsQ0FBQTtRQUVELHNCQUFzQjtRQUN0QixNQUFNLEtBQUssR0FBRyxHQUFHLEVBQUU7WUFDakIsT0FBTyxFQUFFLENBQUM7WUFDVixPQUFPLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFD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