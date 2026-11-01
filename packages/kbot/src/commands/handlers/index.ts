import * as path from 'node:path'
import { IHandler } from './base-handler.js'
import { TextHandler } from './text-handler.js'
import { AudioHandler } from './audio-handler.js'
import { ImageHandler } from './image-handler.js'
import { sync as exists } from '@polymech/fs/exists'

import { IKBotOptions } from '../../zod_types.js'
import { resolve } from '@polymech/commons'
export function createHandlers(options: IKBotOptions): IHandler[] {
  return [
    new AudioHandler(options),
    new ImageHandler(options),
    new TextHandler(),
  ]
}
import { isFile } from '@polymech/commons';

export async function detectAndHandle(content: Buffer | string, options: IKBotOptions): Promise<string> {
  const handlers = createHandlers(options)
  const contentStr = content.toString().trim();  
  const promptPath = options.prompt && options.prompt.length < 4096
    ? path.resolve(resolve(options.prompt, options.alt))
    : '';
  try {
    if (promptPath && isFile(promptPath) && exists(promptPath)) {
      for (const handler of handlers) {
        if (await handler.canHandle(promptPath, true)) {
          return handler.handle(promptPath, true);
        }
      }
    }
  } catch (e) {
    // options.logger?.warn(`Malformed path detected. Treating as content. Error: ${e.message}`);
    // If it's not a valid path, it will throw an error, so we just continue
    console.error(`Malformed path detected. Treating as content. Error: ${e.message}`);
  }

  // Handle as raw content
  for (const handler of handlers) {
    if (await handler.canHandle(contentStr, false)) {
      return handler.handle(contentStr, false);
    }
  }
  
  throw new Error('No suitable handler found for the input content');
}