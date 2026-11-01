
import ffmpeg from '@thedave42/fluent-ffmpeg';
import { logger } from './logger.js';

export interface VideoMetadata {
    duration: number;
    width: number;
    height: number;
    rotation: number;
    aspectRatio: string;
    fps: number;
    stream: Record<string, any>;
}

export function probeVideo(filepath: string): Promise<VideoMetadata> {
    return new Promise((resolve, reject) => {

        ffmpeg.ffprobe(filepath, (err, metadata) => {
            if (err) {
                console.error(`DEBUG: probeVideo error`, err);
                logger.error({ err }, 'ffprobe failed');
                reject(err);
                return;
            }
            console.log(`DEBUG: probeVideo success`, metadata?.format?.duration);

            const format = metadata.format;
            const stream = metadata.streams.find(s => s.codec_type === 'video');

            if (!stream) {
                reject(new Error('No video stream found'));
                return;
            }

            const width = stream.width || 0;
            const height = stream.height || 0;
            const duration = format.duration || stream.duration || 0;

            // Calculate Aspect Ratio or use display_aspect_ratio
            let aspectRatio = stream.display_aspect_ratio;
            if (!aspectRatio && width && height) {
                const gcd = (a: number, b: number): number => b ? gcd(b, a % b) : a;
                const divisor = gcd(width, height);
                aspectRatio = `${width / divisor}:${height / divisor}`;
            }

            // FPS
            let fps = 0;
            if (stream.r_frame_rate) {
                const parts = stream.r_frame_rate.split('/');
                if (parts.length === 2) {
                    fps = parseInt(parts[0]) / parseInt(parts[1]);
                } else {
                    fps = parseFloat(stream.r_frame_rate);
                }
            }

            debugger

            resolve({
                duration: typeof duration === 'string' ? parseFloat(duration) : duration,
                width,
                height,
                rotation: (stream.rotation as number) || 0,
                aspectRatio: aspectRatio || '16:9',
                fps,
                stream
            });
        });
    });
}
