import { BaseHandler } from './base-handler.js';
import { IKBotOptions } from '../../zod_types.js';
/**
 * Hex bytes for the "ID3" tag (ID3v2 header).
 * Typically found at the beginning of an MP3 file that contains ID3 metadata.
 */
export declare const ID3_HEADER_BYTES: Uint8Array<ArrayBuffer>;
/**
 * Possible first two bytes (frame sync) of an MP3 file without an ID3 tag.
 * Commonly:
 *   - 0xFF 0xFB for MPEG-1 Layer III
 *   - 0xFF 0xF3 for MPEG-2 Layer III
 *   - 0xFF 0xF2 for MPEG-2.5 Layer III
 */
export declare const MP3_FRAME_SYNC_PATTERNS: Uint8Array[];
/**
 * "RIFF" in ASCII
 * 0x52 = R
 * 0x49 = I
 * 0x46 = F
 * 0x46 = F
 */
export declare const WAV_RIFF_HEADER: Uint8Array<ArrayBuffer>;
/**
 * "WAVE" in ASCII
 * 0x57 = W
 * 0x41 = A
 * 0x56 = V
 * 0x45 = E
 */
export declare const WAV_WAVE_HEADER: Uint8Array<ArrayBuffer>;
/**
 * Checks if the provided file buffer is likely a WAV file.
 *  - Must start with "RIFF" (bytes 0–3)
 *  - Must have "WAVE" at bytes 8–11
 */
export declare function isWavFile(fileBuffer: Uint8Array): boolean;
/**
 * "ftyp" in ASCII (0x66 = f, 0x74 = t, 0x79 = y, 0x70 = p).
 */
export declare const FTYP_BOX_HEADER: Uint8Array<ArrayBuffer>;
/**
 * Common major/compatible brand signatures for M4A.
 *   - "M4A " (0x4D 0x34 0x41 0x20)
 *   - "mp42" (0x6D 0x70 0x34 0x32)
 *   - "isom" (0x69 0x73 0x6F 0x6D)
 *
 * Note: Some M4A files might list different/older brand combos,
 * but these are the most common.
 */
export declare const M4A_BRANDS: Uint8Array[];
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
export declare function isM4AFile(fileBuffer: Uint8Array): boolean;
export declare class AudioHandler extends BaseHandler {
    private options;
    constructor(options: IKBotOptions);
    canHandle(content: Buffer | string, isPath: boolean): Promise<boolean>;
    handle(content: Buffer | string, isPath: boolean): Promise<string>;
}
