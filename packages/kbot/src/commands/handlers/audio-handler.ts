import * as path from 'node:path'
import * as fs from 'node:fs'
import { BaseHandler } from './base-handler.js';
import { logger  } from '../../index.js'
import { createClient } from '../../client.js';
import { toFile } from "openai"
import { IKBotOptions } from '../../zod_types.js';
/**
 * Hex bytes for the "ID3" tag (ID3v2 header).
 * Typically found at the beginning of an MP3 file that contains ID3 metadata.
 */
export const ID3_HEADER_BYTES = new Uint8Array([0x49, 0x44, 0x33]);

/**
 * Possible first two bytes (frame sync) of an MP3 file without an ID3 tag.
 * Commonly:
 *   - 0xFF 0xFB for MPEG-1 Layer III
 *   - 0xFF 0xF3 for MPEG-2 Layer III
 *   - 0xFF 0xF2 for MPEG-2.5 Layer III
 */
export const MP3_FRAME_SYNC_PATTERNS: Uint8Array[] = [
  new Uint8Array([0xFF, 0xFB]),
  new Uint8Array([0xFF, 0xF3]),
  new Uint8Array([0xFF, 0xF2]),
];

const isMp3File = (fileBuffer: Uint8Array): boolean => {
  const byteView = fileBuffer;

  // Check if the file starts with ID3 bytes
  if (
    byteView[0] === ID3_HEADER_BYTES[0] &&
    byteView[1] === ID3_HEADER_BYTES[1] &&
    byteView[2] === ID3_HEADER_BYTES[2]
  ) {
    return true;
  }

  // Or check if it starts with a known frame sync pattern
  return MP3_FRAME_SYNC_PATTERNS.some((pattern) => {
    return byteView[0] === pattern[0] && byteView[1] === pattern[1];
  });
}
/**
 * "RIFF" in ASCII
 * 0x52 = R
 * 0x49 = I
 * 0x46 = F
 * 0x46 = F
 */
export const WAV_RIFF_HEADER = new Uint8Array([0x52, 0x49, 0x46, 0x46]);

/**
 * "WAVE" in ASCII
 * 0x57 = W
 * 0x41 = A
 * 0x56 = V
 * 0x45 = E
 */
export const WAV_WAVE_HEADER = new Uint8Array([0x57, 0x41, 0x56, 0x45]);

/**
 * Checks if the provided file buffer is likely a WAV file.
 *  - Must start with "RIFF" (bytes 0–3)
 *  - Must have "WAVE" at bytes 8–11
 */
export function isWavFile(fileBuffer: Uint8Array): boolean {
  const byteView = fileBuffer;

  // Safety check: we need at least 12 bytes to validate "RIFF" + "WAVE" positions
  if (byteView.length < 12) {
    return false;
  }

  // Check the "RIFF" part (bytes 0..3)
  if (
    byteView[0] !== WAV_RIFF_HEADER[0] ||
    byteView[1] !== WAV_RIFF_HEADER[1] ||
    byteView[2] !== WAV_RIFF_HEADER[2] ||
    byteView[3] !== WAV_RIFF_HEADER[3]
  ) {
    return false;
  }

  // Check the "WAVE" part (bytes 8..11)
  if (
    byteView[8] !== WAV_WAVE_HEADER[0] ||
    byteView[9] !== WAV_WAVE_HEADER[1] ||
    byteView[10] !== WAV_WAVE_HEADER[2] ||
    byteView[11] !== WAV_WAVE_HEADER[3]
  ) {
    return false;
  }

  return true;
}
/**
 * "ftyp" in ASCII (0x66 = f, 0x74 = t, 0x79 = y, 0x70 = p).
 */
export const FTYP_BOX_HEADER = new Uint8Array([0x66, 0x74, 0x79, 0x70]);

/**
 * Common major/compatible brand signatures for M4A.
 *   - "M4A " (0x4D 0x34 0x41 0x20)
 *   - "mp42" (0x6D 0x70 0x34 0x32)
 *   - "isom" (0x69 0x73 0x6F 0x6D)
 * 
 * Note: Some M4A files might list different/older brand combos,
 * but these are the most common.
 */
export const M4A_BRANDS: Uint8Array[] = [
  new Uint8Array([0x4D, 0x34, 0x41, 0x20]), // "M4A "
  new Uint8Array([0x6D, 0x70, 0x34, 0x32]), // "mp42"
  new Uint8Array([0x69, 0x73, 0x6F, 0x6D]), // "isom"
];

/**
 * Checks if the provided file buffer likely represents an M4A.
 * 
 * Basic check:
 *   1. Must have at least 12 bytes (4 bytes size + "ftyp" + brand).
 *   2. Bytes [4..7] should be "f t y p".
 *   3. Bytes [8..11] should match a known brand (e.g., "M4A ", "mp42", "isom").
 * 
 * @param fileBuffer The raw file data as an ArrayBuffer
 * @returns boolean indicating if this is likely an M4A
 */
export function isM4AFile(fileBuffer: Uint8Array): boolean {
  const byteView = fileBuffer;

  // We need at least 12 bytes to check: [0..3] size, [4..7] 'ftyp', [8..11] brand
  if (byteView.length < 12) {
    return false;
  }

  // Check that bytes [4..7] == "ftyp"
  if (
    byteView[4] !== FTYP_BOX_HEADER[0] ||
    byteView[5] !== FTYP_BOX_HEADER[1] ||
    byteView[6] !== FTYP_BOX_HEADER[2] ||
    byteView[7] !== FTYP_BOX_HEADER[3]
  ) {
    return false;
  }

  // Extract the 4-byte brand at [8..11]
  const brandBytes = byteView.subarray(8, 12);

  // Check if brandBytes matches any known brand
  const matchesKnownBrand = M4A_BRANDS.some((brand) => {
    return (
      brandBytes[0] === brand[0] &&
      brandBytes[1] === brand[1] &&
      brandBytes[2] === brand[2] &&
      brandBytes[3] === brand[3]
    );
  });

  return matchesKnownBrand;
}

const createBuffer = (path: string): Buffer | null => {
  try {
      const buffer = fs.readFileSync(path)
      return buffer;
  } catch (error) {
      console.error('Error creating buffer:', error);
      return null;
  }
}
const getAudioFileType = (filePath: string | Buffer): { fileName: string; mimeType: string } => {
  const ext = typeof filePath === 'string' ? path.extname(filePath).toLowerCase() : null;
  if (ext) {
    switch (ext) {
      case '.mp3':
        return { fileName: 'audio.mp3', mimeType: 'audio/mpeg' };
      case '.m4a':
        return { fileName: 'audio.m4a', mimeType: 'audio/m4a' };
      case '.wav':
        return { fileName: 'audio.wav', mimeType: 'audio/wav' };
    }
  }

  // If no ext or not a string (buffer), detect from content
  const buffer = Buffer.isBuffer(filePath) ? filePath : fs.readFileSync(filePath as string);
  if (isMp3File(buffer)) {
    return { fileName: 'audio.mp3', mimeType: 'audio/mpeg' };
  } else if (isM4AFile(buffer)) {
    return { fileName: 'audio.m4a', mimeType: 'audio/m4a' };
  } else if (isWavFile(buffer)) {
    return { fileName: 'audio.wav', mimeType: 'audio/wav' };
  }
  throw new Error('Unsupported audio format');
};

export class AudioHandler extends BaseHandler {
  private options: IKBotOptions;

  constructor(options: IKBotOptions) {
    super();
    this.options = options;
  }

  async canHandle(content: Buffer | string, isPath: boolean): Promise<boolean> {
    if (isPath) {
      // Check file extension for paths
      const ext = path.extname(content as string).toLowerCase();
      return ['.wav', '.mp3', '.m4a'].includes(ext);
    }
    
    // Check content type for buffers
    if (!Buffer.isBuffer(content)) return false;
    return isMp3File(content) || isWavFile(content) || isM4AFile(content);
  }

  async handle(content: Buffer | string, isPath: boolean): Promise<string> {
    const client = createClient({...this.options,router: 'openai'})
    if (!client) {
      throw new Error('Failed to create OpenAI client for audio transcription');
    }
    
    try {
      
      let audioType: { fileName: string; mimeType: string };

      if (isPath) {
        const filePath = content as string;
        audioType = getAudioFileType(filePath);
      } else {
        audioType = getAudioFileType(content as Buffer);
      }

      const file = await toFile(createBuffer(content as string), audioType.fileName, { type: audioType.mimeType });
      if (!file) {
        logger.error('Error converting source to file');
        throw new Error('Failed to create file for transcription');
      }

      logger.debug(`Transcribing audio content... ${audioType.fileName} : ${audioType.mimeType}`);
      const transcription = await client.audio.transcriptions.create({
        file,
        model: 'whisper-1',
        response_format: "verbose_json",
      });

      if (transcription && transcription.text) {
        logger.info('Successfully transcribed audio content');
        return transcription.text;
      } else {
        throw new Error('No transcription text received from OpenAI');
      }
    } catch (error) {
      logger.error('Failed to transcribe audio:', (error as Error).message);
      throw new Error(`Audio transcription failed: ${(error as Error).message}`);
    }
  }
}