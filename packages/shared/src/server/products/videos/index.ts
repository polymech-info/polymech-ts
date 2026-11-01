import { Context } from 'hono';
import { AbstractProduct } from '../AbstractProduct.js';
import {
    postVideoRoute,
    getJobRoute,
    downloadVideoRoute,
    uploadVideoRoute,
    getJobProgressRoute,
    getHlsPlaylistRoute,
    getHlsSegmentRoute,
    cancelJobRoute,
    getVideoLogsRoute,
    streamVideoLogsRoute,
    proxyVideoRoute
} from './routes.js';
import { VideoWorker, VIDEO_JOB_NAME } from './worker.js';
import fs from 'fs/promises';
import path from 'path';
import { logger } from './logger.js';
import { createHash } from 'crypto';
import { PgBoss } from 'pg-boss';
import { EventEmitter } from 'events';
import { streamSSE } from 'hono/streaming';
import { createLogHandlers } from '@/commons/log-routes-factory.js';

const STORAGE_DIR = path.resolve(process.cwd(), process.env.VIDEO_STORE || 'videos');
const CACHE_DIR = path.join(process.cwd(), 'cache');

export class VideosProduct extends AbstractProduct<any> {
    id = 'videos';
    routes!: any[];
    jobOptions = {};
    actions = {};
    workers: VideoWorker[] = [];
    private boss?: PgBoss;
    public events = new EventEmitter();

    hash(data: any): string {
        return 'videos-hash';
    }

    meta(userId: string): any {
        return { userId };
    }

    constructor() {
        super();

        const { getHandler, streamHandler } = createLogHandlers(path.join(process.cwd(), 'logs', 'videos.json'));

        this.routes = [
            { definition: postVideoRoute, handler: this.handlePostVideo.bind(this) },
            { definition: uploadVideoRoute, handler: this.handleUploadVideo.bind(this) },
            { definition: getJobRoute, handler: this.handleGetJob.bind(this) },
            { definition: getJobProgressRoute, handler: this.handleGetJobProgress.bind(this) },
            { definition: getHlsPlaylistRoute, handler: this.handleGetHlsPlaylist.bind(this) },
            { definition: getHlsSegmentRoute, handler: this.handleGetHlsSegment.bind(this) },
            { definition: downloadVideoRoute, handler: this.handleDownloadVideo.bind(this) },
            { definition: cancelJobRoute, handler: this.handleCancelJob.bind(this) },
            { definition: getVideoLogsRoute, handler: getHandler },
            { definition: streamVideoLogsRoute, handler: streamHandler },
            { definition: proxyVideoRoute, handler: this.handleProxyVideo.bind(this) }
        ];
    }

    async onStart(boss?: PgBoss) {
        // Ensure cache directory exists
        try {
            await fs.mkdir(CACHE_DIR, { recursive: true });
            await fs.mkdir(STORAGE_DIR, { recursive: true });
        } catch (err) { }

        if (boss) {
            this.boss = boss;
            const worker = new VideoWorker();
            worker.events = this.events; // Inject EventEmitter
            this.workers.push(worker);

            // Ensure queue exists
            await boss.createQueue(worker.queueName);

            // Register worker
            await boss.work(worker.queueName, worker.handler.bind(worker) as any);
            logger.info(`[VideosProduct] Registered worker: ${worker.queueName}`);
        } else {
            logger.warn('[VideosProduct] PgBoss not available, video processing will not work');
        }
    }

    async handlePostVideo(c: Context) {
        try {
            if (!this.boss) {
                return c.json({ error: 'Video processing service unavailable' }, 503);
            }

            let file: File | undefined;
            let url: string | undefined;

            // Handle Multipart
            const contentType = c.req.header('Content-Type') || '';
            if (contentType.includes('multipart/form-data')) {
                const body = await c.req.parseBody();
                file = body['file'] as File;
                url = (body['url'] as string) || c.req.query('url');
            } else {
                // Handle JSON
                try {
                    const json = await c.req.json();
                    url = json.url;
                } catch {
                    url = c.req.query('url');
                }
            }

            const presetName = c.req.query('preset') || 'original';

            if (!file && !url) {
                return c.json({ error: 'No file or URL provided' }, 400);
            }

            let inputPath = '';
            let inputSource: 'file' | 'url' = 'url';

            if (file) {
                // Save uploaded file temporarily to cache so ffmpeg can read it
                const buffer = await file.arrayBuffer();
                const hash = createHash('sha256').update(Buffer.from(buffer)).digest('hex');
                const tempFilename = `upload_${hash}.tmp`;
                inputPath = path.join(CACHE_DIR, tempFilename);
                await fs.writeFile(inputPath, Buffer.from(buffer));
                inputSource = 'file';
            } else {
                // For URL, we use the URL directly
                inputPath = url!;
                inputSource = 'url';
            }

            // Create Job via Boss
            const jobId = await this.boss.send(VIDEO_JOB_NAME, {
                inputSource,
                inputPath: inputSource === 'file' ? inputPath : undefined,
                inputUrl: inputSource === 'url' ? inputPath : undefined,
                preset: presetName
            });

            if (!jobId) {
                throw new Error('Failed to create job');
            }

            return c.json({
                jobId: jobId,
                preset: presetName,
                message: 'Video processing started'
            }, 202);

        } catch (err: any) {
            console.error('DEBUG: handlePostVideo error', err);
            logger.error({ err }, 'Failed to start video job');
            return c.json({ error: err.message }, 500);
        }
    }

    async handleUploadVideo(c: Context) {
        try {
            if (!this.boss) {
                return c.json({ error: 'Service Unavailable' }, 503);
            }

            const body = await c.req.parseBody();
            const file = body['file'] as File;
            const presetName = c.req.query('preset') || 'original';

            if (!file) {
                return c.json({ error: 'No file provided' }, 400);
            }

            const buffer = await file.arrayBuffer();
            const hash = createHash('sha256').update(Buffer.from(buffer)).digest('hex');
            const tempFilename = `upload_${hash}.tmp`;
            const inputPath = path.join(CACHE_DIR, tempFilename);
            await fs.writeFile(inputPath, Buffer.from(buffer));

            // Probe
            const { probeVideo } = await import('./probe.js');
            const meta = await probeVideo(inputPath);

            // Submit Job
            const jobId = await this.boss.send(VIDEO_JOB_NAME, {
                inputSource: 'file',
                inputPath: inputPath,
                preset: presetName
            });

            if (!jobId) throw new Error('Job creation failed');

            // Generate Thumbnail
            const { extractThumbnail } = await import('./thumbnail.js');
            const thumbFilename = `${jobId}_thumb.jpg`;
            // Ensure CACHE_DIR exists
            await fs.mkdir(CACHE_DIR, { recursive: true });
            await extractThumbnail(inputPath, CACHE_DIR, thumbFilename);


            // Prepare DB Entry
            const { supabase } = await import('../../commons/supabase.js');
            const baseUrl = process.env.SERVER_IMAGE_API_URL || process.env.VITE_SERVER_IMAGE_API_URL || 'http://localhost:3333';

            // Should point to HLS playlist
            const hlsUrl = `${baseUrl}/api/videos/jobs/${jobId}/hls/playlist.m3u8`;
            const thumbnailUrl = `${baseUrl}/api/images/cache/${thumbFilename}`;

            const dbMeta = {
                status: "ready", // Ideally 'processing', but for now 'ready' means ready to exist in DB
                tracks: [
                    {
                        id: jobId,
                        type: "video",
                        duration: meta.duration,
                        max_width: meta.width,
                        max_height: meta.height,
                        max_frame_rate: meta.fps,
                        ...meta.stream
                    }
                ],
                duration: meta.duration,
                created_at: Math.floor(Date.now() / 1000).toString(),
                aspect_ratio: meta.aspectRatio,
                mux_asset_id: `asset_${jobId}`,
                mux_upload_id: `upload_${jobId}`,
                mux_playback_id: jobId,
                max_stored_frame_rate: meta.fps,
                max_stored_resolution: meta.height >= 2160 ? 'UHD' : (meta.height >= 1080 ? 'HD' : 'SD')
            };

            const userId = c.req.query('userId') || '00000000-0000-0000-0000-000000000000';
            const title = c.req.query('title') || 'Video Upload';

            const { data: dbData, error: dbError } = await supabase
                .from('pictures')
                .insert({
                    meta: dbMeta,
                    image_url: hlsUrl,
                    thumbnail_url: thumbnailUrl,
                    title: title,
                    user_id: userId,
                    type: 'video-intern'
                })
                .select()
                .single();

            if (dbError) {
                logger.error({ dbError }, 'Supabase insert failed');
                throw new Error(`Database insert failed: ${JSON.stringify(dbError)}`);
            }

            return c.json({
                jobId,
                dbId: dbData.id,
                videoUrl: hlsUrl,
                thumbnailUrl,
                meta: dbMeta
            });

        } catch (err: any) {
            logger.error({ err }, 'Upload Video failed');
            return c.json({ error: err.message }, 500);
        }
    }

    async handleGetJob(c: Context) {
        if (!this.boss) {
            return c.json({ error: 'Service unavailable' }, 503);
        }

        const id = c.req.param('id');
        // @ts-ignore
        const job = await this.boss.getJobById(VIDEO_JOB_NAME, id);

        if (!job) {
            return c.json({ error: 'Job not found' }, 404);
        }

        const baseUrl = process.env.SERVER_IMAGE_API_URL || process.env.VITE_SERVER_IMAGE_API_URL || 'http://localhost:3333';

        const status = job.state;
        const result = job.output as any;

        // Use HLS URL for completed jobs
        const resultUrl = status === 'completed'
            ? `${baseUrl}/api/videos/jobs/${job.id}/hls/playlist.m3u8`
            : undefined;

        let progress = 0;
        if (status === 'completed') progress = 100;

        return c.json({
            id: job.id,
            status: status,
            progress: progress,
            resultUrl,
            error: null // Capture error if failed?
        });
    }

    async handleGetHlsPlaylist(c: Context) {
        const id = c.req.param('id');
        const filepath = path.join(STORAGE_DIR, id, 'playlist.m3u8');

        try {
            const { createReadStream, statSync } = await import('fs');
            statSync(filepath); // Check exist
            const stream = createReadStream(filepath);

            c.header('Content-Type', 'application/vnd.apple.mpegurl');
            // @ts-ignore
            return c.body(stream);
        } catch (e) {
            return c.text('Playlist not found', 404);
        }
    }

    async handleCancelJob(c: Context) {
        if (!this.boss) {
            return c.json({ error: 'Service unavailable' }, 503);
        }

        const id = c.req.param('id');
        logger.info({ jobId: id }, 'Received cancel request');

        // Cancel PgBoss Job
        try {
            await this.boss.cancel(VIDEO_JOB_NAME, id);
        } catch (e) {
            console.error('Failed to cancel boss job', e);
        }

        // Kill Worker Process
        // Assuming single worker for now
        const worker = this.workers.find(w => w.queueName === VIDEO_JOB_NAME);
        if (worker) {
            worker.cancelJob(id);
        }

        return c.json({ message: 'Cancellation requested' });
    }

    async handleGetHlsSegment(c: Context) {
        const id = c.req.param('id');
        const segment = c.req.param('segment');

        // Simple security check
        if (segment.includes('..') || segment.includes('/') || segment.includes('\\')) {
            return c.text('Invalid segment', 400);
        }

        const filepath = path.join(STORAGE_DIR, id, segment);

        try {
            const { createReadStream, statSync } = await import('fs');
            statSync(filepath);
            const stream = createReadStream(filepath);

            c.header('Content-Type', 'video/MP2T');
            // @ts-ignore
            return c.body(stream);
        } catch (e) {
            return c.text('Segment not found', 404);
        }
    }

    async handleGetJobProgress(c: Context) {
        const id = c.req.param('id');

        return streamSSE(c, async (stream) => {
            const listener = (data: any) => {
                // data could be { progress: number } or { log: string }
                stream.writeSSE({
                    data: JSON.stringify(data),
                    event: 'progress',
                    id: String(Date.now())
                });
            };

            this.events.on(`progress:${id}`, listener);

            // Send initial connection message
            await stream.writeSSE({
                data: JSON.stringify({ connected: true }),
                event: 'connected',
                id: String(Date.now())
            });

            stream.onAbort(() => {
                this.events.off(`progress:${id}`, listener);
            });

            // Wait forever (or until client disconnects)
            await new Promise(() => { });
        });
    }

    async handleDownloadVideo(c: Context) {
        if (!this.boss) {
            return c.json({ error: 'Service unavailable' }, 503);
        }

        const id = c.req.param('id');
        // PgBoss getJobById usually takes (queue, id) or similar in newer versions if partitioned
        // @ts-ignore
        const job = await this.boss.getJobById(VIDEO_JOB_NAME, id);

        if (!job || job.state !== 'completed') {
            return c.text('Video not found or not ready', 404);
        }

        const result = job.output as any;
        if (!result || !result.resultPath) {
            return c.text('Video result missing', 404);
        }

        const filepath = path.join(STORAGE_DIR, result.resultPath);
        console.log(`DEBUG: handleDownloadVideo id=${id} filepath=${filepath}`);

        try {
            const { createReadStream, statSync } = await import('fs');
            const stats = statSync(filepath);
            const fileSize = stats.size;

            const range = c.req.header('range');

            if (range) {
                const parts = range.replace(/bytes=/, "").split("-");
                const start = parseInt(parts[0], 10);
                const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
                const chunksize = (end - start) + 1;
                const stream = createReadStream(filepath, { start, end });

                c.status(206);
                c.header('Content-Range', `bytes ${start}-${end}/${fileSize}`);
                c.header('Accept-Ranges', 'bytes');
                c.header('Content-Length', chunksize.toString());
                c.header('Content-Type', 'video/mp4');

                // @ts-ignore
                return c.body(stream);
            } else {
                const stream = createReadStream(filepath);
                c.header('Content-Length', fileSize.toString());
                c.header('Content-Type', 'video/mp4');
                c.header('Accept-Ranges', 'bytes');
                // @ts-ignore
                return c.body(stream);
            }

        } catch (e) {
            return c.text('File missing on disk', 500);
        }
    }

    async handleProxyVideo(c: Context) {
        const url = c.req.query('url');
        if (!url) {
            // @ts-ignore
            return c.text('Missing URL', 400);
        }

        try {
            // Forward the request to the target URL
            const response = await fetch(url);

            if (!response.ok) {
                // @ts-ignore
                return c.text(`Proxy fetch failed: ${response.statusText}`, response.status as ContentfulStatusCode);
            }

            // Stream the response body
            if (response.body) {
                // Forward headers
                const contentType = response.headers.get('content-type');
                const contentLength = response.headers.get('content-length');

                if (contentType) c.header('Content-Type', contentType);
                if (contentLength) c.header('Content-Length', contentLength);
                c.header('Access-Control-Allow-Origin', '*'); // Ensure CORS is allowed for the proxy

                // @ts-ignore
                return c.body(response.body);
            } else {
                // @ts-ignore
                return c.text('No content', 204);
            }

        } catch (e: any) {
            console.error('Proxy error:', e);
            // @ts-ignore
            return c.text('Proxy error', 500);
        }
    }
}
