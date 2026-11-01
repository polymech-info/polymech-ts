import { BaseHandler } from './base-handler.js'
import { sync as read } from '@polymech/fs/read'
import * as path from 'node:path'

export class TextHandler extends BaseHandler {
  async canHandle(content: Buffer | string, isPath: boolean): Promise<boolean> {
    if (isPath) {
      // For file paths, check file extension
      const ext = path.extname(content as string).toLowerCase();
      return ['.txt', '.md', '.json', '.js', '.ts'].includes(ext);
    }
    
    // For raw content, try to decode as UTF-8 text
    try {
      if (Buffer.isBuffer(content)) {
        content.toString('utf8');
      }
      return true;
    } catch {
      return false;
    }
  }

  async handle(content: Buffer | string, isPath: boolean): Promise<string> {
    if (isPath) {
      // Read content from file
      return read(content as string, 'string') as string;
    }
    
    // Return raw content as string
    return Buffer.isBuffer(content) ? content.toString('utf8') : content;
  }
}