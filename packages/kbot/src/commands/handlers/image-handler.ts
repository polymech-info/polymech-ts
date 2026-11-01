import { BaseHandler } from './base-handler.js'
import * as path from 'node:path'
import { sync as read } from '@polymech/fs/read'
import { createClient } from '../../client.js'
import { logger  } from '../../index.js'
import { toFile } from 'openai'
import { IKBotOptions } from '../../zod_types.js'

// Common image file signatures/magic numbers
const IMAGE_SIGNATURES = {
  // JPEG/JPG start with FF D8
  JPEG: new Uint8Array([0xFF, 0xD8]),
  // PNG start with 89 50 4E 47 0D 0A 1A 0A
  PNG: new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
  // GIF starts with either GIF87a or GIF89a
  GIF87a: new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x37, 0x61]),
  GIF89a: new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61])
};

const isImageContent = (buffer: Buffer): boolean => {
  if (!buffer || buffer.length < 8) return false;

  // Check JPEG
  if (buffer[0] === IMAGE_SIGNATURES.JPEG[0] && buffer[1] === IMAGE_SIGNATURES.JPEG[1]) {
    return true;
  }

  // Check PNG
  if (IMAGE_SIGNATURES.PNG.every((byte, i) => buffer[i] === byte)) {
    return true;
  }

  // Check GIF
  const isGif87a = IMAGE_SIGNATURES.GIF87a.every((byte, i) => buffer[i] === byte);
  const isGif89a = IMAGE_SIGNATURES.GIF89a.every((byte, i) => buffer[i] === byte);
  if (isGif87a || isGif89a) {
    return true;
  }

  return false;
};

export const getImageType = (filePath: string | Buffer): { fileName: string; mimeType: string } => {
  if (typeof filePath === 'string') {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
      case '.jpg':
      case '.jpeg':
        return { fileName: 'image.jpg', mimeType: 'image/jpeg' };
      case '.png':
        return { fileName: 'image.png', mimeType: 'image/png' };
      case '.gif':
        return { fileName: 'image.gif', mimeType: 'image/gif' };
    }
  }

  // Detect from content
  const buffer = Buffer.isBuffer(filePath) ? filePath : read(filePath as string);
  
  if (!buffer) throw new Error('Could not read image content');

  if (buffer[0] === IMAGE_SIGNATURES.JPEG[0] && buffer[1] === IMAGE_SIGNATURES.JPEG[1]) {
    return { fileName: 'image.jpg', mimeType: 'image/jpeg' };
  }
  if (IMAGE_SIGNATURES.PNG.every((byte, i) => buffer[i] === byte)) {
    return { fileName: 'image.png', mimeType: 'image/png' };
  }
  if (IMAGE_SIGNATURES.GIF87a.every((byte, i) => buffer[i] === byte) ||
      IMAGE_SIGNATURES.GIF89a.every((byte, i) => buffer[i] === byte)) {
    return { fileName: 'image.gif', mimeType: 'image/gif' };
  }

  throw new Error('Unsupported image format');
};

export class ImageHandler extends BaseHandler {
  private options: IKBotOptions;

  constructor(options: IKBotOptions) {
    super();
    this.options = options;
  }

  async canHandle(content: Buffer | string, isPath: boolean): Promise<boolean> {
    try {
      if (isPath) {
        const ext = path.extname(content as string).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.gif'].includes(ext);
      }
      return Buffer.isBuffer(content) && isImageContent(content);
    } catch {
      return false;
    }
  }

  async handle(content: Buffer | string, isPath: boolean): Promise<string> {
    const client = createClient({...this.options, router: 'openai'});
    if (!client) {
      throw new Error('Failed to create OpenAI client for image analysis');
    }

    try {
      const imageType = getImageType(content);
      const buffer = isPath ? read(content as string) : content as Buffer;
      
      if (!buffer) {
        throw new Error('Failed to read image content');
      }

      const file = await toFile(buffer as Buffer, imageType.fileName, { type: imageType.mimeType });
      if (!file) {
        throw new Error('Failed to create file for vision analysis');
      }

      logger.debug(`Analyzing image content... ${imageType.fileName} : ${imageType.mimeType}`);
      
      const response = await client.chat.completions.create({
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Describe this image in detail, focusing on relevant technical or content aspects:' },
              { type: 'image_url', image_url: { url: `data:${imageType.mimeType};base64,${buffer.toString('base64')}` } }
            ],
          },
        ],
        max_tokens: 1500,
      });

      if (response.choices[0]?.message?.content) {
        logger.info('Successfully analyzed image content');
        return response.choices[0].message.content;
      } else {
        throw new Error('No analysis received from OpenAI');
      }
    } catch (error) {
      logger.error('Failed to analyze image:', (error as Error).message);
      throw new Error(`Image analysis failed: ${(error as Error).message}`);
    }
  }
}