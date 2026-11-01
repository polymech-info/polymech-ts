import * as path from 'node:path';
import * as fs from 'node:fs';
import { BaseHandler } from './base-handler.js';
import { logger } from '../../index.js';
import { createClient } from '../../client.js';
import { toFile } from "openai";
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
export const MP3_FRAME_SYNC_PATTERNS = [
    new Uint8Array([0xFF, 0xFB]),
    new Uint8Array([0xFF, 0xF3]),
    new Uint8Array([0xFF, 0xF2]),
];
const isMp3File = (fileBuffer) => {
    const byteView = fileBuffer;
    // Check if the file starts with ID3 bytes
    if (byteView[0] === ID3_HEADER_BYTES[0] &&
        byteView[1] === ID3_HEADER_BYTES[1] &&
        byteView[2] === ID3_HEADER_BYTES[2]) {
        return true;
    }
    // Or check if it starts with a known frame sync pattern
    return MP3_FRAME_SYNC_PATTERNS.some((pattern) => {
        return byteView[0] === pattern[0] && byteView[1] === pattern[1];
    });
};
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
export function isWavFile(fileBuffer) {
    const byteView = fileBuffer;
    // Safety check: we need at least 12 bytes to validate "RIFF" + "WAVE" positions
    if (byteView.length < 12) {
        return false;
    }
    // Check the "RIFF" part (bytes 0..3)
    if (byteView[0] !== WAV_RIFF_HEADER[0] ||
        byteView[1] !== WAV_RIFF_HEADER[1] ||
        byteView[2] !== WAV_RIFF_HEADER[2] ||
        byteView[3] !== WAV_RIFF_HEADER[3]) {
        return false;
    }
    // Check the "WAVE" part (bytes 8..11)
    if (byteView[8] !== WAV_WAVE_HEADER[0] ||
        byteView[9] !== WAV_WAVE_HEADER[1] ||
        byteView[10] !== WAV_WAVE_HEADER[2] ||
        byteView[11] !== WAV_WAVE_HEADER[3]) {
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
export const M4A_BRANDS = [
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
export function isM4AFile(fileBuffer) {
    const byteView = fileBuffer;
    // We need at least 12 bytes to check: [0..3] size, [4..7] 'ftyp', [8..11] brand
    if (byteView.length < 12) {
        return false;
    }
    // Check that bytes [4..7] == "ftyp"
    if (byteView[4] !== FTYP_BOX_HEADER[0] ||
        byteView[5] !== FTYP_BOX_HEADER[1] ||
        byteView[6] !== FTYP_BOX_HEADER[2] ||
        byteView[7] !== FTYP_BOX_HEADER[3]) {
        return false;
    }
    // Extract the 4-byte brand at [8..11]
    const brandBytes = byteView.subarray(8, 12);
    // Check if brandBytes matches any known brand
    const matchesKnownBrand = M4A_BRANDS.some((brand) => {
        return (brandBytes[0] === brand[0] &&
            brandBytes[1] === brand[1] &&
            brandBytes[2] === brand[2] &&
            brandBytes[3] === brand[3]);
    });
    return matchesKnownBrand;
}
const createBuffer = (path) => {
    try {
        const buffer = fs.readFileSync(path);
        return buffer;
    }
    catch (error) {
        console.error('Error creating buffer:', error);
        return null;
    }
};
const getAudioFileType = (filePath) => {
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
    const buffer = Buffer.isBuffer(filePath) ? filePath : fs.readFileSync(filePath);
    if (isMp3File(buffer)) {
        return { fileName: 'audio.mp3', mimeType: 'audio/mpeg' };
    }
    else if (isM4AFile(buffer)) {
        return { fileName: 'audio.m4a', mimeType: 'audio/m4a' };
    }
    else if (isWavFile(buffer)) {
        return { fileName: 'audio.wav', mimeType: 'audio/wav' };
    }
    throw new Error('Unsupported audio format');
};
export class AudioHandler extends BaseHandler {
    options;
    constructor(options) {
        super();
        this.options = options;
    }
    async canHandle(content, isPath) {
        if (isPath) {
            // Check file extension for paths
            const ext = path.extname(content).toLowerCase();
            return ['.wav', '.mp3', '.m4a'].includes(ext);
        }
        // Check content type for buffers
        if (!Buffer.isBuffer(content))
            return false;
        return isMp3File(content) || isWavFile(content) || isM4AFile(content);
    }
    async handle(content, isPath) {
        const client = createClient({ ...this.options, router: 'openai' });
        if (!client) {
            throw new Error('Failed to create OpenAI client for audio transcription');
        }
        try {
            let audioType;
            if (isPath) {
                const filePath = content;
                audioType = getAudioFileType(filePath);
            }
            else {
                audioType = getAudioFileType(content);
            }
            const file = await toFile(createBuffer(content), audioType.fileName, { type: audioType.mimeType });
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
            }
            else {
                throw new Error('No transcription text received from OpenAI');
            }
        }
        catch (error) {
            logger.error('Failed to transcribe audio:', error.message);
            throw new Error(`Audio transcription failed: ${error.message}`);
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXVkaW8taGFuZGxlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb21tYW5kcy9oYW5kbGVycy9hdWRpby1oYW5kbGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sS0FBSyxJQUFJLE1BQU0sV0FBVyxDQUFBO0FBQ2pDLE9BQU8sS0FBSyxFQUFFLE1BQU0sU0FBUyxDQUFBO0FBQzdCLE9BQU8sRUFBRSxXQUFXLEVBQUUsTUFBTSxtQkFBbUIsQ0FBQztBQUNoRCxPQUFPLEVBQUUsTUFBTSxFQUFHLE1BQU0sZ0JBQWdCLENBQUE7QUFDeEMsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLGlCQUFpQixDQUFDO0FBQy9DLE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxRQUFRLENBQUE7QUFFL0I7OztHQUdHO0FBQ0gsTUFBTSxDQUFDLE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxVQUFVLENBQUMsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7QUFFbkU7Ozs7OztHQU1HO0FBQ0gsTUFBTSxDQUFDLE1BQU0sdUJBQXVCLEdBQWlCO0lBQ25ELElBQUksVUFBVSxDQUFDLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQzVCLElBQUksVUFBVSxDQUFDLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQzVCLElBQUksVUFBVSxDQUFDLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0NBQzdCLENBQUM7QUFFRixNQUFNLFNBQVMsR0FBRyxDQUFDLFVBQXNCLEVBQVcsRUFBRTtJQUNwRCxNQUFNLFFBQVEsR0FBRyxVQUFVLENBQUM7SUFFNUIsMENBQTBDO0lBQzFDLElBQ0UsUUFBUSxDQUFDLENBQUMsQ0FBQyxLQUFLLGdCQUFnQixDQUFDLENBQUMsQ0FBQztRQUNuQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEtBQUssZ0JBQWdCLENBQUMsQ0FBQyxDQUFDO1FBQ25D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