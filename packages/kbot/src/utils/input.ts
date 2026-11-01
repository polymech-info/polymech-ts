import * as path from 'node:path'
import { sync as exists } from '@polymech/fs/exists'
import { sync as read } from '@polymech/fs/read'
import { resolve, isFile } from '@polymech/commons'

import { detectAndHandle } from '../commands/handlers/index.js'
import { logger  } from '../index.js'
import { IKBotOptions } from '../zod_types.js'

export const readStdin = async (timeoutMs: number = 100): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    if (process.stdin.isTTY) {
      resolve(Buffer.from(''));
      return;
    }

    const onData = (chunk: Buffer) => {
      chunks.push(Buffer.from(chunk));
    }

    // Handle end of stdin
    const onEnd = () => {
      cleanup();
      resolve(Buffer.concat(chunks));
    }

    const onError = (err: Error) => {
      cleanup();
      reject(err);
    }

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

export const resolveQuery = async (options: IKBotOptions): Promise<string> => {
  const stdinContent = await readStdin();
  if (stdinContent.length > 0) {
    try {
      return await detectAndHandle(stdinContent, options);
    } catch (error) {
      logger.error('Failed to process stdin content:', error.message);
      throw error;
    }
  }

  if (options.prompt) {
    const queryPath = options.prompt.length < 4096
      ? path.resolve(resolve(options.prompt, options.alt)) || ''
      : '';
    if (queryPath && exists(queryPath) && isFile(queryPath)) {
      const fileContent = read(queryPath, 'buffer') as Buffer;
      try {
        return await detectAndHandle(fileContent,options)
      } catch (error) {
        logger.error(`Failed to process file ${queryPath}:`, error.message);
        throw error;
      }
    }
    // 3. Return direct prompt string
    return options.prompt;
  }
  return ""
}
