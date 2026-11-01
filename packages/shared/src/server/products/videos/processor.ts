
import ffmpeg from '@thedave42/fluent-ffmpeg';
import path from 'path';
import fs from 'fs/promises';
import { VideoJob, jobQueue } from './jobs.js';
import { getPreset } from './presets.js';
import { logger } from '../../commons/logger.js';

// Ensure ffmpeg is available in path or set it here if needed
// ffmpeg.setFfmpegPath('/path/to/ffmpeg'); 

const CACHE_DIR = path.join(process.cwd(), 'cache');

export async function processVideoJob(jobId: string) {
    const job = await jobQueue.get(jobId);
    if (!job) return;

    await jobQueue.update(job.id, { status: 'processing', progress: 0 });

    try {
        const preset = getPreset(job.preset);
        const outputFilename = `${job.id}.${preset.format}`;
        const outputPath = path.join(CACHE_DIR, outputFilename);

        // Ensure input exists
        let inputPath = job.inputPath;

        // If URL, we could stream it or download it first. 
        // fluent-ffmpeg handles URLs, but downloading first is safer for stability.
        if (job.inputSource === 'url' && job.inputUrl) {
            logger.info({ jobId, url: job.inputUrl }, 'Downloading video from URL');
            const res = await fetch(job.inputUrl);
            if (!res.ok) throw new Error(`Failed to download video: ${res.statusText}`);

            const arrayBuffer = await res.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            const tempFilename = `download_${job.id}.tmp`;
            inputPath = path.join(CACHE_DIR, tempFilename);
            await fs.writeFile(inputPath, buffer);

            logger.info({ jobId, inputPath }, 'Download complete');
        }

        if (!inputPath) {
            throw new Error('No input path or URL provided');
        }

        logger.info({ jobId, preset: preset.id }, 'Starting ffmpeg processing');

        return new Promise<void>((resolve, reject) => {
            let command = ffmpeg(inputPath);

            // Apply Size
            if (preset.size) {
                command = command.size(preset.size);
            }

            // Apply FPS
            if (preset.fps) {
                command = command.fps(preset.fps);
            }

            // Apply Bitrates
            if (preset.videoBitrate) {
                command = command.videoBitrate(preset.videoBitrate);
            }
            if (preset.audioBitrate) {
                command = command.audioBitrate(preset.audioBitrate);
            }

            let lastPercent = -1;

            command
                .on('start', (commandLine) => {
                    logger.info({ jobId, commandLine }, 'Spawned Ffmpeg');
                })
                .on('progress', (progress) => {
                    const percent = progress.percent ? Math.round(progress.percent) : 0;
                    if (percent > lastPercent + 5 || percent === 100) {
                        lastPercent = percent;
                        // logger.debug({ jobId, percent }, 'Progress update');
                        jobQueue.update(job.id, { progress: percent });
                    }
                })
                .on('error', (err) => {
                    logger.error({ jobId, err }, 'An error occurred processing video');
                    jobQueue.update(job.id, { status: 'failed', error: err.message }).then(() => reject(err));
                })
                .on('end', () => {
                    logger.info({ jobId }, 'Processing finished!');
                    jobQueue.update(job.id, { status: 'completed', progress: 100, resultPath: outputFilename }).then(() => resolve());
                })
                .save(outputPath);
        });

    } catch (err: any) {
        logger.error({ jobId, err }, 'Fatal job error');
        await jobQueue.update(job.id, { status: 'failed', error: err.message });
    }
}
