
import ffmpeg from '@thedave42/fluent-ffmpeg';
import { logger } from './logger.js';
import path from 'path';

export function extractThumbnail(videoPath: string, outputDir: string, filename: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const outputPath = path.join(outputDir, filename);
        ffmpeg(videoPath)
            .screenshots({
                timestamps: [0],
                filename: filename,
                folder: outputDir,
                size: '640x?'
            })
            .on('end', () => {
                resolve(outputPath);
            })
            .on('error', (err) => {
                logger.error({ err }, 'Thumbnail generation failed');
                reject(err);
            });
    });
}
