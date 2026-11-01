import * as path from 'node:path'
import { sync as read } from '@polymech/fs/read'

import { ChatCompletionUserMessageParam } from 'openai/resources/index.mjs'

import { base64 } from './source.js'
export type IHandlerResult = ChatCompletionUserMessageParam  & 
{
  path?: string
}

export interface IMimeHandler {
  handle(filePath: string, relativePath: string): IHandlerResult;
}

export class ImageHandler implements IMimeHandler {
  handle(filePath: string, relativePath: string): IHandlerResult {
    return {
      role: "user",
      content: [
        {
          type: "image_url",
          image_url: {
            url: base64(filePath)
          }
        }
      ]
    }
  }
}

export class PDFHandler implements IMimeHandler {
  handle(filePath: string, relativePath: string): IHandlerResult {
    return {
      path: relativePath,
      content: base64(filePath),
      role: "user",
      name: path.parse(filePath).base
    }
  }
}

export class TextHandler implements IMimeHandler {
  handle(filePath: string, relativePath: string): IHandlerResult {
    return {
      role: "user",
      path: relativePath,
      content: read(filePath).toString()
    }
  }
}

export class MimeHandlerRegistry {
  private handlers: Map<string, IMimeHandler> = new Map();

  registerHandler(mimeType: string, handler: IMimeHandler) {
    this.handlers.set(mimeType, handler);
  }

  getHandler(mimeType: string): IMimeHandler | null {
    // For mime types like 'image/png', try to match 'image/*' if specific type not found
    const [type] = mimeType.split('/');
    return this.handlers.get(mimeType) || this.handlers.get(`${type}/*`) || null;
  }
}

// Create and export a pre-configured registry
export const defaultMimeRegistry = new MimeHandlerRegistry();

// Register default handlers
defaultMimeRegistry.registerHandler('image/*', new ImageHandler());
defaultMimeRegistry.registerHandler('application/pdf', new PDFHandler());
defaultMimeRegistry.registerHandler('text/*', new TextHandler());
