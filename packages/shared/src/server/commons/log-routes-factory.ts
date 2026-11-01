import { createRoute, z } from '@hono/zod-openapi';
import { Context } from 'hono';
import { streamSSE, stream } from 'hono/streaming';
import fs from 'fs';
import readline from 'readline';

/**
 * Creates OpenAPI route definitions for standard log endpoints.
 * @param tag The OpenAPI tag for grouping (e.g. 'System', 'Images')
 * @param pathPrefix The URL path prefix (e.g. '/api/logs/system')
 */
export const createLogRoutes = (tag: string, pathPrefix: string) => {
    const getRoute = createRoute({
        method: 'get',
        path: pathPrefix,
        tags: [tag],
        summary: `Get ${tag} logs`,
        description: `Download or view ${tag} logs as a JSON array`,
        responses: {
            200: {
                description: 'Log content',
                content: {
                    'application/json': {
                        schema: z.array(z.record(z.string(), z.any())).openapi({
                            description: 'Array of log entries'
                        })
                    }
                }
            },
            404: {
                description: 'Log file not found'
            }
        }
    });

    const streamRoute = createRoute({
        method: 'get',
        path: `${pathPrefix}/stream`,
        tags: [tag],
        summary: `Stream ${tag} logs`,
        description: `Stream ${tag} logs via SSE (Server-Sent Events)`,
        responses: {
            200: {
                description: 'Log stream',
                content: {
                    'text/event-stream': { schema: z.string() }
                }
            }
        }
    });

    return { getRoute, streamRoute };
};

/**
 * Creates Hono handlers for standard log endpoints.
 * @param filePath The absolute path to the log file
 */
export const createLogHandlers = (filePath: string) => {
    const getHandler = async (c: Context) => {
        if (!fs.existsSync(filePath)) {
            return c.text('Log file not found', 404);
        }

        c.header('Content-Type', 'application/json');

        return stream(c, async (stream) => {
            const fileStream = fs.createReadStream(filePath);
            const rl = readline.createInterface({
                input: fileStream,
                crlfDelay: Infinity
            });

            await stream.write('[');
            let first = true;

            for await (const line of rl) {
                if (!line.trim()) continue;
                if (!first) {
                    await stream.write(',');
                }
                try {
                    // Validate JSON to ensure we don't stream garbage?
                    // Optional: overhead. Assuming pino writes valid JSON per line.
                    // Just writing the line directly is faster.
                    await stream.write(line);
                    first = false;
                } catch (e) {
                    // Ignore broken lines
                }
            }

            await stream.write(']');
        });
    };

    const streamHandler = async (c: Context) => {
        return streamSSE(c, async (stream) => {
            // Send initial connection message
            await stream.writeSSE({
                data: JSON.stringify({ type: 'info', message: 'Connected to log stream' })
            });

            if (!fs.existsSync(filePath)) {
                await stream.writeSSE({
                    data: JSON.stringify({ type: 'error', message: 'Log file not found' })
                });
                // We keep the stream open in case the file is created later
            }

            let currentSize = 0;
            // Check initial size
            if (fs.existsSync(filePath)) {
                const stat = fs.statSync(filePath);
                currentSize = stat.size;

                // Optional: Tail current content?
                // For simplicity, we start streaming NEW content.
                // But let's verify if we should send a bit of context.
                // If it's a JSON log, partial lines are bad.
                // If it's text, partial lines are bad too.
                // Let's just track current size and stream updates.
            }

            const checkInterval = 250; // Check every 250ms

            const interval = setInterval(async () => {
                try {
                    if (!fs.existsSync(filePath)) {
                        if (currentSize > 0) {
                            currentSize = 0; // File deleted
                            await stream.writeSSE({ data: JSON.stringify({ type: 'info', message: 'Log file deleted' }) });
                        }
                        return;
                    }

                    const stat = fs.statSync(filePath);

                    if (stat.size > currentSize) {
                        const sizeDiff = stat.size - currentSize;
                        const buffer = Buffer.alloc(sizeDiff);
                        const fd = fs.openSync(filePath, 'r');
                        try {
                            fs.readSync(fd, buffer, 0, sizeDiff, currentSize);
                            currentSize = stat.size;

                            const chunk = buffer.toString('utf-8');
                            // If it's line-delimited JSON or text
                            const lines = chunk.split('\n');
                            // Note: the last line might be incomplete if we read exactly to EOF while writing?
                            // But usually logger writes full lines.
                            // However, strictly we should handle buffering incomplete lines.
                            // For this "standard" goal, let's assume atomic writes or simple line splitting.

                            // To be safer with valid JSON, we could filter empty lines.
                            for (const line of lines) {
                                if (!line.trim()) continue;
                                await stream.writeSSE({ data: line });
                            }
                        } finally {
                            fs.closeSync(fd);
                        }
                    } else if (stat.size < currentSize) {
                        // Truncated / Rotated
                        currentSize = stat.size;
                        await stream.writeSSE({
                            data: JSON.stringify({ type: 'info', message: 'Log rotated' })
                        });
                    }
                } catch (e) {
                    console.error('Stream error:', e);
                }
            }, checkInterval);

            stream.onAbort(() => {
                clearInterval(interval);
            });

            // Keep the stream alive
            await new Promise(() => { });
        });
    };

    return { getHandler, streamHandler };
};
