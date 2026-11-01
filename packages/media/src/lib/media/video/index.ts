
import { FfprobeData } from 'fluent-ffmpeg'
import { z } from 'zod'

const FfmpegCommand = require('fluent-ffmpeg')

export const GLOB_BASIC = 'png|jpg|tiff|jpeg|webp'
export * from './resize'
export * from './convert'

export const E_Format = {
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
  } as const;
  
  export const E_LogLevel = {
    QUIET: 'quiet',
    PANIC: 'panic',
    FATAL: 'fatal',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info',
    VERBOSE: 'verbose',
    DEBUG: 'debug',
    TRACE: 'trace'
  } as const;
  
  export const E_AudioCodec = {
    AAC: 'aac',
    MP3: 'mp3',
    VORBIS: 'vorbis',
    FLAC: 'flac',
    OPUS: 'opus',
    WAV: 'wav'
  } as const;
  
  export const E_Codec = {
    LIBX264: 'libx264',
    LIBX265: 'libx265',
    LIBVP9: 'libvpx-vp9',
    LIBAOM: 'libaom-av1',
    LIBTHEORA: 'libtheora',
    MPEG2VIDEO: 'mpeg2video',
    COPY: 'copy'
  } as const;
  
  const formatEnum = z.nativeEnum(E_Format)
  const loglevelEnum = z.nativeEnum(E_LogLevel)
  const audioCodecEnum = z.nativeEnum(E_AudioCodec)
  const codecEnum = z.nativeEnum(E_Codec)
  
  const ffmpegOptionsSchema = z.object({
    input: z.string().describe("Path to the input file"),
    output: z.string().describe("Path to the output file"),
    codec: codecEnum.optional().describe("Codec to be used for encoding (e.g., 'libx264', 'aac')").default(E_Codec.LIBX264),
    bitrate: z.string().optional().describe("Bitrate for encoding (e.g., '500k', '2M')"),
    framerate: z.number().optional().describe("Frames per second (e.g., 30, 60)").default(30),
    resolution: z.string().optional().describe("Resolution of the output (e.g., '1920x1080', '1280x720')"),
    audioCodec: audioCodecEnum.optional().describe("Audio codec to be used for encoding (e.g., 'aac', 'mp3')").default(E_AudioCodec.AAC),
    audioBitrate: z.string().optional().describe("Bitrate for audio encoding (e.g., '128k', '256k')"),
    audioChannels: z.number().optional().describe("Number of audio channels (e.g., 1 for mono, 2 for stereo)").default(2),
    preset: z.string().optional().describe("Encoding preset to use for balancing speed and quality (e.g., 'ultrafast', 'medium', 'slow')").default('medium'),
    crf: z.number().optional().describe("Constant Rate Factor for controlling quality (lower values mean higher quality, range: 0-51)").default(23),
    format: formatEnum.optional().describe("Container format for output file (e.g., 'mp4', 'mkv', 'mov')").default(E_Format.MP4),
    startTime: z.string().optional().describe("Start time of the input file (e.g., '00:01:30' for 1 minute 30 seconds)"),
    duration: z.string().optional().describe("Duration of the output (e.g., '00:05:00' for 5 minutes)"),
    overwrite: z.boolean().optional().describe("Whether to overwrite the output file if it already exists").default(false),
    loglevel: loglevelEnum.optional().describe("Logging level for ffmpeg output").default(E_LogLevel.INFO),
  });
  
  export type FFmpegOptions = z.infer<typeof ffmpegOptionsSchema>
  