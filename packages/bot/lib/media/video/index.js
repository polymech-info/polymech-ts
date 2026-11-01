"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.E_Codec = exports.E_AudioCodec = exports.E_LogLevel = exports.E_Format = exports.GLOB_BASIC = void 0;
const zod_1 = require("zod");
const FfmpegCommand = require('fluent-ffmpeg');
exports.GLOB_BASIC = 'png|jpg|tiff|jpeg|webp';
__exportStar(require("./resize"), exports);
__exportStar(require("./convert"), exports);
exports.E_Format = {
    MP4: 'mp4',
    MKV: 'mkv',
    MOV: 'mov',
    AVI: 'avi',
    FLV: 'flv',
    WMV: 'wmv',
    WEBM: 'webm',
    MP3: 'mp3',
    OGG: 'ogg',
    WAV: 'wav'
};
exports.E_LogLevel = {
    QUIET: 'quiet',
    PANIC: 'panic',
    FATAL: 'fatal',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info',
    VERBOSE: 'verbose',
    DEBUG: 'debug',
    TRACE: 'trace'
};
exports.E_AudioCodec = {
    AAC: 'aac',
    MP3: 'mp3',
    VORBIS: 'vorbis',
    FLAC: 'flac',
    OPUS: 'opus',
    WAV: 'wav'
};
exports.E_Codec = {
    LIBX264: 'libx264',
    LIBX265: 'libx265',
    LIBVP9: 'libvpx-vp9',
    LIBAOM: 'libaom-av1',
    LIBTHEORA: 'libtheora',
    MPEG2VIDEO: 'mpeg2video',
    COPY: 'copy'
};
const formatEnum = zod_1.z.nativeEnum(exports.E_Format);
const loglevelEnum = zod_1.z.nativeEnum(exports.E_LogLevel);
const audioCodecEnum = zod_1.z.nativeEnum(exports.E_AudioCodec);
const codecEnum = zod_1.z.nativeEnum(exports.E_Codec);
const ffmpegOptionsSchema = zod_1.z.object({
    input: zod_1.z.string().describe("Path to the input file"),
    output: zod_1.z.string().describe("Path to the output file"),
    codec: codecEnum.optional().describe("Codec to be used for encoding (e.g., 'libx264', 'aac')").default(exports.E_Codec.LIBX264),
    bitrate: zod_1.z.string().optional().describe("Bitrate for encoding (e.g., '500k', '2M')"),
    framerate: zod_1.z.number().optional().describe("Frames per second (e.g., 30, 60)").default(30),
    resolution: zod_1.z.string().optional().describe("Resolution of the output (e.g., '1920x1080', '1280x720')"),
    audioCodec: audioCodecEnum.optional().describe("Audio codec to be used for encoding (e.g., 'aac', 'mp3')").default(exports.E_AudioCodec.AAC),
    audioBitrate: zod_1.z.string().optional().describe("Bitrate for audio encoding (e.g., '128k', '256k')"),
    audioChannels: zod_1.z.number().optional().describe("Number of audio channels (e.g., 1 for mono, 2 for stereo)").default(2),
    preset: zod_1.z.string().optional().describe("Encoding preset to use for balancing speed and quality (e.g., 'ultrafast', 'medium', 'slow')").default('medium'),
    crf: zod_1.z.number().optional().describe("Constant Rate Factor for controlling quality (lower values mean higher quality, range: 0-51)").default(23),
    format: formatEnum.optional().describe("Container format for output file (e.g., 'mp4', 'mkv', 'mov')").default(exports.E_Format.MP4),
    startTime: zod_1.z.string().optional().describe("Start time of the input file (e.g., '00:01:30' for 1 minute 30 seconds)"),
    duration: zod_1.z.string().optional().describe("Duration of the output (e.g., '00:05:00' for 5 minutes)"),
    overwrite: zod_1.z.boolean().optional().describe("Whether to overwrite the output file if it already exists").default(false),
    loglevel: loglevelEnum.optional().describe("Logging level for ffmpeg output").default(exports.E_LogLevel.INFO),
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbGliL21lZGlhL3ZpZGVvL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUEsNkJBQXVCO0FBRXZCLE1BQU0sYUFBYSxHQUFHLE9BQU8sQ0FBQyxlQUFlLENBQUMsQ0FBQTtBQUVqQyxRQUFBLFVBQVUsR0FBRyx3QkFBd0IsQ0FBQTtBQUNsRCwyQ0FBd0I7QUFDeEIsNENBQXlCO0FBRVosUUFBQSxRQUFRLEdBQUc7SUFDcEIsR0FBRyxFQUFFLEtBQUs7SUFDVixHQUFHLEVBQUUsS0FBSztJQUNWLEdBQUcsRUFBRSxLQUFLO0lBQ1YsR0FBRyxFQUFFLEtBQUs7SUFDVixHQUFHLEVBQUUsS0FBSztJQUNWLEdBQUcsRUFBRSxLQUFLO0lBQ1YsSUFBSSxFQUFFLE1BQU07SUFDWixHQUFHLEVBQUUsS0FBSztJQUNWLEdBQUcsRUFBRSxLQUFLO0lBQ1YsR0FBRyxFQUFFLEtBQUs7Q0FDRixDQUFDO0FBRUUsUUFBQSxVQUFVLEdBQUc7SUFDeEIsS0FBSyxFQUFFLE9BQU87SUFDZCxLQUFLLEVBQUUsT0FBTztJQUNkLEtBQUssRUFBRSxPQUFPO0lBQ2QsS0FBSyxFQUFFLE9BQU87SUFDZCxPQUFPLEVBQUUsU0FBUztJQUNsQixJQUFJLEVBQUUsTUFBTTtJQUNaLE9BQU8sRUFBRSxTQUFTO0lBQ2xCLEtBQUssRUFBRSxPQUFPO0lBQ2QsS0FBSyxFQUFFLE9BQU87Q0FDTixDQUFDO0FBRUUsUUFBQSxZQUFZLEdBQUc7SUFDMUIsR0FBRyxFQUFFLEtBQUs7SUFDVixHQUFHLEVBQUUsS0FBSztJQUNWLE1BQU0sRUFBRSxRQUFRO0lBQ2hCLElBQUksRUFBRSxNQUFNO0lBQ1osSUFBSSxFQUFFLE1BQU07SUFDWixHQUFHLEVBQUUsS0FBSztDQUNGLENBQUM7QUFFRSxRQUFBLE9BQU8sR0FBRztJQUNyQixPQUFPLEVBQUUsU0FBUztJQUNsQixP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