import { Job } from 'pg-boss';
import { AbstractWorker } from '../../jobs/boss/AbstractWorker.js';
import { Worker } from '../../commons/decorators.js';
import ffmpeg from '@thedave42/fluent-ffmpeg';
import path from 'path';
import fs from 'fs/promises';
import { getPreset } from './presets.js';
import { logger } from './logger.js';
import { EventEmitter } from 'events';

export const VIDEO_JOB_NAME = 'video-processing';
const STORAGE_DIR = path.resolve(process.cwd(), process.env.VIDEO_STORE || 'videos');
const CACHE_DIR = path.join(process.cwd(), 'cache'); // Keep cache for temp inputs

export interface VideoJobData {
    inputSource: 'file' | 'url';
    inputPath?: string;
    inputUrl?: string;
    preset: string;
}

@Worker(VIDEO_JOB_NAME)
export class VideoWorker extends AbstractWorker<VideoJobData> {
    readonly queueName = VIDEO_JOB_NAME;
    public events?: EventEmitter;
    private activeCommands = new Map<string, ffmpeg.FfmpegCommand>();

    calculateCost(job: Job<VideoJobData>, result: any): number {
        // Simple cost for now, maybe dependent on duration later
        return 1;
    }

    protected async process(job: Job<VideoJobData>) {
        const { id, data } = job;
        const preset = getPreset(data.preset);

        // Output directory for this job
        const jobDir = path.join(STORAGE_DIR, id);
        const outputFilename = 'playlist.m3u8';
        const outputPath = path.join(jobDir, outputFilename);

        let inputPath = data.inputPath;

        // Ensure directories exist
        try {
            await fs.mkdir(CACHE_DIR, { recursive: true });
            await fs.mkdir(STORAGE_DIR, { recursive: true });
            await fs.mkdir(jobDir, { recursive: true }); // Create job specific dir
        } catch (err) { }

        // Handle URL download if needed
        if (data.inputSource === 'url' && data.inputUrl) {
            logger.info({ jobId: id, url: data.inputUrl }, 'Downloading video from URL');
            const res = await fetch(data.inputUrl);
            if (!res.ok) throw new Error(`Failed to download video: ${res.statusText}`);

            const arrayBuffer = await res.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            const tempFilename = `download_${id}.tmp`;
            inputPath = path.join(CACHE_DIR, tempFilename);
            await fs.writeFile(inputPath, buffer);

            logger.info({ jobId: id, inputPath }, 'Download complete');
        }

        if (!inputPath) {
            throw new Error('No input path or URL provided');
        }

        logger.info({ jobId: id, preset: preset.id }, 'Starting ffmpeg HLS processing');

        await new Promise<void>((resolve, reject) => {
            let command = ffmpeg(inputPath!);

            this.activeCommands.set(id, command);
            // HLS Options
            // ffmpeg -i input.mp4 -b:v 1M -g 60 -hls_time 2 -hls_list_size 0 -hls_segment_size 500000 output.m3u8
            const threads = process.env.FFMPEG_THREADS || '1';
            let presetName = process.env.FFMPEG_PRESET || 'copy';

            if (presetName === 'copy') {
                logger.info({ jobId: id }, 'Using COPY mode (no transcode)');
                command = command
                    .outputOptions([
                        '-c copy',
                        // HLS flags for copy mode
                        '-hls_time 10', // Target 10s segments, but will split on keyframes
                        '-hls_list_size 0',
                        '-f hls'
                    ]);
            } else {
                // Apply Size only if encoding
                if (preset.size) {
                    command = command.size(preset.size);
                }

                command = command
                    .outputOptions([
                        `-threads ${threads}`,
                        `-preset ${presetName}`,
                        '-b:v 1M',
                        '-g 60',
                        '-hls_time 300',
                        '-hls_list_size 0',
                        '-hls_segment_size 500000'
                    ]);
            }

            command
                .on('start', (commandLine) => {
                    logger.info({ jobId: id, commandLine }, 'Spawned Ffmpeg');
                })
                .on('progress', (progress) => {
                    if (this.events) {
                        const p = progress.percent || 0;
                        this.events.emit(`progress:${id}`, { progress: p });
                    }
                })
                .on('stderr', (stderrLine) => {
                    if (this.events) {
                        this.events.emit(`progress:${id}`, { log: stderrLine });
                    }
                })
                .on('error', (err) => {
                    // Check if it was killed
                    if (err.message.includes('SIGKILL')) {
                        logger.info({ jobId: id }, 'Process killed');
                    } else {
                        logger.error({ jobId: id, err }, 'An error occurred processing video');
                    }
                    this.activeCommands.delete(id);
                    reject(err);
                })
                .on('end', () => {
                    logger.info({ jobId: id }, 'Processing finished!');
                    this.activeCommands.delete(id);
                    resolve();
                })
                .save(outputPath);
        });

        const result = {
            success: true,
            resultPath: `${id}/${outputFilename}`, // Relative path to storage root
            preset: preset.id
        };
        logger.info({ jobId: id, result }, 'Worker finished processing');
        return result;
    }

    public cancelJob(jobId: string): boolean {
        const command = this.activeCommands.get(jobId);
        if (command) {
            try {
                command.kill('SIGKILL');
                this.activeCommands.delete(jobId);
                logger.info({ jobId: jobId }, 'Job cancelled via kill');
                return true;
            } catch (err) {
                logger.error({ jobId: jobId, err }, 'Failed to kill command');
            }
        }
        return false;
    }
}
