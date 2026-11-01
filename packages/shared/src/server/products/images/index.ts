import { Context } from 'hono';
import { AbstractProduct } from '../AbstractProduct.js';
import { postImageRoute, getImageRoute, postResponsiveImageRoute, getImageLogsRoute, streamImageLogsRoute, renderImageRoute, postTransformRoute } from './routes.js';
import { createLogHandlers } from '../../commons/log-routes-factory.js';
import { PublicEndpointRegistry } from '../../commons/registry.js';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { createHash } from 'crypto';
import { logger } from './logger.js';
import { getPresets } from './presets.js';

import 'dotenv/config';

export const CACHE_DIR = process.env.CACHE_DIR || path.join(process.cwd(), 'cache');
export const CACHE_TTL = process.env.CACHE_DEFAULT_TTL ? Math.floor(parseInt(process.env.CACHE_DEFAULT_TTL) / 1000) : 31536000;

export async function ensureCachedImage(inputBuffer: Buffer, width: number, height: number | undefined, format: string): Promise<string> {
    const { filename } = await _ensureCachedImage(inputBuffer, width, height, format);
    return filename;
}

export async function _ensureCachedImage(inputBuffer: Buffer, width: number, height: number | undefined, format: string): Promise<{ filename: string; hit: boolean }> {
    // 1. Hash compatibility with ResponsiveImage logic
    let hashStr = `w${width}`;
    if (height) hashStr += `h${height}`;
    hashStr += `f${format}`;

    const hash = createHash('sha256')
        .update(inputBuffer)
        .update(hashStr)
        .digest('hex');

    const filename = `${hash}.${format}`;
    const filepath = path.join(CACHE_DIR, filename);

    // 2. Check Cache
    try {
        await fs.access(filepath);
        return { filename, hit: true };
    } catch {
        // Miss
    }

    // 3. Process
    const pipeline = sharp(inputBuffer);
    pipeline.resize({
        width,
        height,
        withoutEnlargement: true,
        fit: 'inside'
    });
    pipeline.toFormat(format as keyof sharp.FormatEnum);
    const processedBuffer = await pipeline.toBuffer();
    await fs.writeFile(filepath, processedBuffer);

    return { filename, hit: false };
}

export async function ensureCachedImageFromUrl(url: string, width: number | undefined, height: number | undefined, format: string): Promise<string> {
    const { filename } = await _ensureCachedImageFromUrl(url, width, height, format);
    return filename;
}

export async function _ensureCachedImageFromUrl(url: string, width: number | undefined, height: number | undefined, format: string): Promise<{ filename: string; hit: boolean }> {
    // 1. URL-Based Hash Key (Deterministic)
    const hashKey = createHash('sha256')
        .update(url)
        .update(`w${width}h${height}f${format}`)
        .digest('hex');

    const filename = `${hashKey}.${format}`;
    const filepath = path.join(CACHE_DIR, filename);

    // 2. Check Cache
    try {
        await fs.access(filepath);
        return { filename, hit: true };
    } catch {
        // Miss
    }

    // 3. Fetch & Process
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), process.env.IMAGE_FETCH_TIMEOUT_MS ? parseInt(process.env.IMAGE_FETCH_TIMEOUT_MS) : 10000);
    let fetchRes: Response;
    try {
        fetchRes = await fetch(url, { signal: controller.signal });
    } finally {
        clearTimeout(timeout);
    }

    if (!fetchRes.ok) {
        logger.error({
            msg: 'Failed to fetch image',
            url,
            status: fetchRes.status,
            statusText: fetchRes.statusText,
            headers: Object.fromEntries(fetchRes.headers.entries())
        });
        throw new Error(`Failed to fetch image: ${fetchRes.statusText}`);
    }

    const arrayBuffer = await fetchRes.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    const pipeline = sharp(inputBuffer);
    if (width || height) {
        pipeline.resize({
            width,
            height,
            withoutEnlargement: true,
            fit: 'inside'
        });
    }
    pipeline.toFormat(format as keyof sharp.FormatEnum);
    const processedBuffer = await pipeline.toBuffer();

    // 4. Save Cache
    await fs.writeFile(filepath, processedBuffer);

    return { filename, hit: false };
}

export class ImagesProduct extends AbstractProduct<any> {
    id = 'images';
    jobOptions = {};
    actions = {};
    workers = [];
    routes!: any[];

    constructor() {
        super();

        const { getHandler, streamHandler } = createLogHandlers(path.join(process.cwd(), 'logs', 'images.json'));

        this.routes = [
            { definition: postImageRoute, handler: this.handlePostImage.bind(this) },
            { definition: getImageRoute, handler: this.handleGetImage.bind(this) },
            { definition: postResponsiveImageRoute, handler: this.handlePostResponsive.bind(this) },
            { definition: getImageLogsRoute, handler: getHandler },
            { definition: streamImageLogsRoute, handler: streamHandler },
            { definition: renderImageRoute, handler: this.handleRenderImage.bind(this) },
            { definition: postTransformRoute, handler: this.handleTransformImage.bind(this) }
        ];

        // Register Public Endpoints
        //PublicEndpointRegistry.register('/api/images', 'POST');
        PublicEndpointRegistry.register('/api/images/responsive', 'POST');
        PublicEndpointRegistry.register('/api/images/render', 'GET');
        PublicEndpointRegistry.register('/api/images/cache/:filename', 'GET');
        // PublicEndpointRegistry.register('/api/images/transform', 'POST');
    }

    async onStart() {
        // Ensure cache directory exists
        try {
            await fs.mkdir(CACHE_DIR, { recursive: true });
        } catch (err) {
            logger.error({ err }, 'Failed to create cache directory');
        }
    }

    hash(data: any): string {
        return 'images-hash';
    }

    meta(userId: string): any {
        return { userId };
    }

    async handlePostImage(c: Context) {
        try {
            const body = await c.req.parseBody();
            const file = body['file'];
            const presets = getPresets();
            const presetName = c.req.query('preset');
            const forward = c.req.query('forward');
            const useCache = c.req.query('cache') !== 'false';
            const isOriginal = c.req.query('original') === 'true';

            let preset: any = {};
            if (presetName && presets[presetName]) {
                preset = presets[presetName];
            }

            if (!(file instanceof File)) {
                return c.text('No file uploaded', 400);
            }

            const buffer = await file.arrayBuffer();
            const inputBuffer = Buffer.from(buffer);

            // Detect metadata for defaults
            const meta = await sharp(inputBuffer).metadata();

            // Precedence: Explicit > Preset > Default (Original Format / 2048px)
            const width = body['width'] ? parseInt(body['width'] as string) : (preset['width'] || (isOriginal ? undefined : 2048));
            const height = body['height'] ? parseInt(body['height'] as string) : (preset['height'] || undefined);
            const format = (body['format'] as string) || (preset['format'] || meta.format || 'jpeg');
            const fit = (preset['fit'] || 'inside') as keyof sharp.FitEnum;

            // Generate hash for filename based on content + params
            const hash = createHash('sha256')
                .update(inputBuffer)
                .update(`w${width}h${height}f${format}`)
                .digest('hex');

            const filename = `${hash}.${format}`;
            const filepath = path.join(CACHE_DIR, filename);

            let processedBuffer: Buffer | null = null;

            // 1. Try Cache
            if (useCache) {
                try {
                    processedBuffer = await fs.readFile(filepath);
                    logger.debug({ filename }, 'Image cache hit - read from disk');
                } catch {
                    // Not found in cache
                }
            }

            if (!processedBuffer) {
                // 2. Process if no cache
                logger.debug({ filename }, 'Image cache miss - processing');
                const pipeline = sharp(inputBuffer);
                if (width || height) {
                    pipeline.resize({
                        width,
                        height,
                        withoutEnlargement: true,
                        fit: fit
                    });
                }
                pipeline.toFormat(format as keyof sharp.FormatEnum);
                processedBuffer = await pipeline.toBuffer();

                // Save to cache immediately
                await fs.writeFile(filepath, processedBuffer);
            }

            if (!processedBuffer) {
                throw new Error('Image processing failed to produce buffer');
            }

            // --- 1. SUPABASE FORWARDING ---
            if (forward === 'supabase') {
                try {
                    // Check env vars before import
                    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
                        throw new Error('Missing Supabase credentials in server environment');
                    }

                    const { supabase } = await import('../../commons/supabase.js');
                    const bucket = process.env.SUPABASE_BUCKET || 'pictures';
                    const storagePath = `cache/${filename}`;

                    const { error: uploadError } = await supabase.storage
                        .from(bucket)
                        .upload(storagePath, processedBuffer, {
                            contentType: `image/${format}`,
                            upsert: true
                        });

                    if (uploadError) {
                        logger.error({ err: uploadError, bucket, storagePath }, 'Supabase upload failed');
                        return c.json({ error: 'Failed to upload to external storage', details: uploadError.message }, 502);
                    }


                    const { data: { publicUrl } } = supabase.storage
                        .from(bucket)
                        .getPublicUrl(storagePath);

                    const sharpMeta = await sharp(processedBuffer).metadata();

                    // Extract EXIF Metadata
                    const { extractImageMetadata } = await import('./metadata.js');
                    const exifMeta = await extractImageMetadata(processedBuffer);

                    return c.json({
                        url: publicUrl,
                        width: sharpMeta.width,
                        height: sharpMeta.height,
                        format: sharpMeta.format,
                        size: sharpMeta.size,
                        filename: storagePath,
                        meta: exifMeta
                    });


                } catch (err: any) {
                    logger.error({ err }, 'Supabase forwarding error');
                    const status = err.message.includes('Missing Supabase') ? 500 : 502;
                    return c.json({ error: err.message }, status as any);
                }
            }

            // --- 2. LOCAL CACHING (Handled above) ---
            // processedBuffer is already written to cache if it was processed, or read from cache if hit.

            const url = `/api/images/cache/${filename}`;
            logger.info({ url }, 'Image processed and cached');
            return c.redirect(url, 303);

        } catch (err: any) {
            logger.error({ err }, 'Image processing failed');
            return c.text(err.message, 500);
        }
    }

    async handleGetImage(c: Context) {
        const filename = c.req.param('filename');
        if (!filename) return c.text('Filename required', 400);

        // Sanitize filename to prevent directory traversal
        const safeFilename = path.basename(filename);
        const filepath = path.join(CACHE_DIR, safeFilename);

        try {
            const content = await fs.readFile(filepath);
            // Infer mimetype from extension logic or just 'application/octet-stream' / specific type
            // Basic inference:
            const ext = path.extname(safeFilename).slice(1);
            let mime = 'application/octet-stream';
            if (['jpg', 'jpeg'].includes(ext)) mime = 'image/jpeg';
            else if (ext === 'png') mime = 'image/png';
            else if (ext === 'webp') mime = 'image/webp';
            else if (ext === 'gif') mime = 'image/gif';
            else if (ext === 'avif') mime = 'image/avif';

            c.header('Content-Type', mime);
            c.header('Cache-Control', `public, max-age=${CACHE_TTL}, immutable`);
            return c.body(content);
        } catch (err) {
            return c.text('Not found', 404);
        }
    }

    async handlePostResponsive(c: Context) {
        const start = performance.now();
        const variantStats: any[] = [];

        try {
            const body = await c.req.parseBody();
            const file = body['file'];
            const url = body['url'] as string;
            const sizesJson = body['sizes'] as string;
            const formatsJson = body['formats'] as string;

            let inputBuffer: Buffer;

            if (file instanceof File) {
                const buffer = await file.arrayBuffer();
                inputBuffer = Buffer.from(buffer);
            } else if (url) {
                const urlHash = createHash('sha256').update(url).digest('hex');
                const sourceFilename = `source_${urlHash}`;
                const sourcePath = path.join(CACHE_DIR, sourceFilename);

                try {
                    inputBuffer = await fs.readFile(sourcePath);
                } catch {
                    const controller = new AbortController();
                    const timeout = setTimeout(() => controller.abort(), 5000);
                    let fetchRes;
                    try {
                        fetchRes = await fetch(url, { signal: controller.signal });
                    } finally {
                        clearTimeout(timeout);
                    }
                    if (!fetchRes.ok) {
                        logger.error({
                            msg: 'Failed to fetch URL',
                            url,
                            status: fetchRes.status,
                            statusText: fetchRes.statusText,
                            headers: Object.fromEntries(fetchRes.headers.entries())
                        });
                        throw new Error(`Failed to fetch URL: ${fetchRes.statusText}`);
                    }
                    const arrayBuffer = await fetchRes.arrayBuffer();
                    inputBuffer = Buffer.from(arrayBuffer);

                    // Cache the source image
                    await fs.writeFile(sourcePath, inputBuffer).catch(e => {
                        logger.error({ err: e }, 'Failed to write source cache');
                    });
                }
            } else {
                return c.text('No file or URL provided', 400);
            }

            // Defaults
            const sizes: number[] = sizesJson ? JSON.parse(sizesJson) : [180, 640, 1024, 2048];
            const formats: string[] = formatsJson ? JSON.parse(formatsJson) : ['avif', 'webp'];


            const meta = await sharp(inputBuffer).metadata();
            const originalFormat = meta.format || 'jpeg';

            // Allow original format in output if requested or implicit
            const targetFormats = formats.map(f => f === 'original' || f === 'jpg' ? (originalFormat === 'jpeg' ? 'jpeg' : originalFormat) : f);

            // Deduplicate
            const uniqueFormats = [...new Set(targetFormats)];
            const uniqueSizes = [...new Set(sizes)].sort((a, b) => a - b);

            const sources: { srcset: string; type: string }[] = [];
            let fallbackSrc = '';
            let fallbackWidth = 0;
            let fallbackHeight = 0;
            let fallbackFormat = '';

            // Generate all variants
            for (const format of uniqueFormats) {
                const srcSetParts: string[] = [];

                for (const width of uniqueSizes) {
                    const variantStart = performance.now();
                    let filename;
                    const baseUrl = process.env.SERVER_IMAGE_API_URL || process.env.VITE_SERVER_IMAGE_API_URL || 'http://localhost:3333';
                    const LAZY_THRESHOLD = 600;
                    const isLazy = url && width > LAZY_THRESHOLD;

                    if (isLazy) {
                        // LAZY GENERATION: Return Dynamic Render URL
                        // Do NOT process large images eagerly if we have a URL source
                        const renderUrl = `${baseUrl}/api/images/render?url=${encodeURIComponent(url)}&width=${width}&format=${format}`;
                        srcSetParts.push(`${renderUrl} ${width}w`);

                        variantStats.push({ width, format, lazy: true, duration: performance.now() - variantStart });

                        // For fallback calculation, we assume the requested width is what we get
                        // We skip reading meta/file access
                        if (!fallbackSrc || (format === 'jpeg' && fallbackFormat !== 'jpeg') || (width > fallbackWidth && format === fallbackFormat)) {
                            fallbackSrc = renderUrl;
                            fallbackWidth = width;
                            fallbackHeight = 0; // Unknown height without checking, but it's lazy
                            fallbackFormat = format;
                        }
                        continue;
                    }

                    // EAGER GENERATION
                    try {
                        const res = await _ensureCachedImage(inputBuffer, width, undefined, format);
                        filename = res.filename;
                        variantStats.push({ width, format, lazy: false, hit: res.hit, duration: performance.now() - variantStart });
                    } catch (e: any) {
                        logger.error({ err: e }, 'Failed to cache image variant');
                        variantStats.push({ width, format, error: e.message, duration: performance.now() - variantStart });
                        continue;
                    }

                    const cachedUrl = `${baseUrl}/api/images/cache/${filename}`;
                    srcSetParts.push(`${cachedUrl} ${width}w`);

                    // Update fallback to the largest version of the first format (or preferred format)
                    if (!fallbackSrc || (format === 'jpeg' && fallbackFormat !== 'jpeg') || (width > fallbackWidth && format === fallbackFormat)) {
                        fallbackSrc = cachedUrl;
                        fallbackWidth = width; // Use requested width as nominal fallback width
                        fallbackFormat = format;
                    }
                }

                sources.push({
                    srcset: srcSetParts.join(', '),
                    type: `image/${format}`
                });
            }

            const totalDuration = performance.now() - start;
            const seconds = Math.floor(totalDuration / 1000);
            const ms = Math.floor(totalDuration % 1000);
            const durationFormatted = `${seconds}:${ms.toString().padStart(3, '0')}`;

            const performanceStats = {
                totalDuration: durationFormatted,
                variants: variantStats.map(v => {
                    const vSeconds = Math.floor(v.duration / 1000);
                    const vMs = Math.floor(v.duration % 1000);
                    return { ...v, duration: `${vSeconds}:${vMs.toString().padStart(3, '0')}` };
                }),
                url: url ? url : 'file-upload'
            };

            logger.debug({
                msg: 'Responsive image generation complete',
                performance: performanceStats
            });

            return c.json({
                img: {
                    src: fallbackSrc,
                    width: fallbackWidth,
                    height: fallbackHeight,
                    format: fallbackFormat
                },
                sources,
                stats: performanceStats
            });

        } catch (err: any) {
            logger.error({ err }, 'Responsive image generation failed');
            return c.text(err.message, 500);
        }
    }


    async handleRenderImage(c: Context) {
        try {
            const url = c.req.query('url');
            if (!url) return c.text('URL required', 400);

            const widthStr = c.req.query('width');
            const heightStr = c.req.query('height');
            const formatStr = c.req.query('format');

            const width = widthStr ? parseInt(widthStr) : undefined;
            const height = heightStr ? parseInt(heightStr) : undefined;
            const format = formatStr || 'jpeg';

            // 1. URL-Based Hash Key
            const hashKey = createHash('sha256')
                .update(url)
                .update(`w${width}h${height}f${format}`)
                .digest('hex');

            const filename = `${hashKey}.${format}`;
            const filepath = path.join(CACHE_DIR, filename);

            // 2. Check Cache
            try {
                const content = await fs.readFile(filepath);
                // Serve Cache
                c.header('Content-Type', `image/${format}`);
                c.header('Cache-Control', `public, max-age=${CACHE_TTL}, immutable`);
                return c.body(content);
            } catch {
                // Miss - proceed to fetch
            }

            // 3. Fetch & Process
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5000);
            let fetchRes;
            try {
                fetchRes = await fetch(url, { signal: controller.signal });
            } finally {
                clearTimeout(timeout);
            }
            if (!fetchRes.ok) {
                logger.error({
                    msg: 'Failed to fetch image',
                    url,
                    status: fetchRes.status,
                    statusText: fetchRes.statusText,
                    headers: Object.fromEntries(fetchRes.headers.entries())
                });
                throw new Error(`Failed to fetch image: ${fetchRes.statusText}`);
            }

            const arrayBuffer = await fetchRes.arrayBuffer();
            const inputBuffer = Buffer.from(arrayBuffer);

            const pipeline = sharp(inputBuffer);
            if (width || height) {
                pipeline.resize({
                    width,
                    height,
                    withoutEnlargement: true,
                    fit: 'inside'
                });
            }
            pipeline.toFormat(format as keyof sharp.FormatEnum);
            const processedBuffer = await pipeline.toBuffer();

            // 4. Save Cache
            await fs.writeFile(filepath, processedBuffer);

            // 5. Serve
            c.header('Content-Type', `image/${format}`);
            c.header('Cache-Control', `public, max-age=${CACHE_TTL}, immutable`);
            //@todos : fix pre-render
            return c.body(processedBuffer as any);

        } catch (err: any) {
            logger.error({ err }, 'Render image failed');
            return c.text('Internal Server Error', 500);
        }
    }

    async handleTransformImage(c: Context) {
        try {
            const body = await c.req.parseBody();
            const file = body['file'];
            const operationsJson = body['operations'] as string;

            if (!(file instanceof File)) {
                return c.text('No file uploaded', 400);
            }

            const buffer = await file.arrayBuffer();
            const inputBuffer = Buffer.from(buffer);
            const operations = operationsJson ? JSON.parse(operationsJson) : [];

            let pipeline = sharp(inputBuffer);

            for (const op of operations) {
                if (op.type === 'rotate') {
                    pipeline = pipeline.rotate(op.angle);
                } else if (op.type === 'resize') {
                    pipeline = pipeline.resize({
                        width: op.width,
                        height: op.height,
                        fit: op.fit || 'contain',
                        background: { r: 0, g: 0, b: 0, alpha: 0 }
                    });
                } else if (op.type === 'crop') {
                    pipeline = pipeline.extract({
                        left: Math.round(op.x),
                        top: Math.round(op.y),
                        width: Math.round(op.width),
                        height: Math.round(op.height)
                    });
                } else if (op.type === 'flip') {
                    if (op.direction === 'horizontal') pipeline = pipeline.flop();
                    if (op.direction === 'vertical') pipeline = pipeline.flip();
                } else if (op.type === 'adjust') {
                    if (op.brightness) {
                        // Sharp's modulate brightness is a multiplier (1.0 = original) if using recent versions, 
                        // or it might be different. 
                        // Actually pipeline.modulate({ brightness: 0.5 }) usually means 0.5x brightness? 
                        // Let's check docs or assume standard multiplier. 
                        // Wait, common Sharp modulate brightness is additive? No, documentation says "brightness: brightness multiplier".
                        pipeline = pipeline.modulate({ brightness: op.brightness });
                    }
                    if (op.contrast) {
                        // Contrast: C * (pixel - 128) + 128  =>  C * pixel + (128 - 128*C)
                        // This keeps mid-grey fixed.
                        const a = op.contrast;
                        const b = 128 * (1 - a);
                        pipeline = pipeline.linear(a, b);
                    }
                }
            }

            const processedBuffer = await pipeline.toBuffer();
            const meta = await sharp(processedBuffer).metadata();

            c.header('Content-Type', `image/${meta.format}`);
            return c.body(processedBuffer as any);

        } catch (err: any) {
            logger.error({ err }, 'Image transformation failed');
            return c.text(err.message, 500);
        }
    }
}
