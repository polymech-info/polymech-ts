import { createRouteBody } from '../products/serving/routes.js';
import { Context } from 'hono';
import { streamSSE } from 'hono/streaming';
import { z } from '@hono/zod-openapi';
import { appEvents, AppEvent } from '../events.js';
import { logger } from '../commons/logger.js';

export const getStreamRoute = createRouteBody(
    'get',
    '/api/stream',
    ['System'],
    'Stream System Events',
    'Subscribe to real-time updates for categories, posts, and pages.',
    undefined,
    {
        200: {
            description: 'Event Stream',
            content: {
                'text/event-stream': {
                    schema: z.string()
                }
            }
        }
    },
    true // public
);

// Track active connections
const connectedClients = new Set<{
    id: string;
    stream: any; // Hono SSEStreamingApi
}>();

// Single listener for the entire application
const broadcastAppUpdate = async (event: AppEvent) => {
    const payload = JSON.stringify(event);
    for (const client of connectedClients) {
        try {
            await client.stream.writeSSE({
                event: event.kind,
                data: payload
            });
        } catch (err) {
            logger.error({ err, clientId: client.id }, 'Error broadcasting to stream');
            // Client will be removed by the onAbort handler in the stream handler
        }
    }
};

// Subscribe once
appEvents.on('app-update', broadcastAppUpdate);

export const streamHandler = async (c: Context) => {
    return streamSSE(c, async (stream) => {
        const id = crypto.randomUUID();
        const client = { id, stream };

        connectedClients.add(client);
        // Send initial connection message
        await stream.writeSSE({
            event: 'connected',
            data: JSON.stringify({ message: 'Connected to event stream', clientId: id })
        });

        // Keep connection alive & handle cleanup
        let interval: NodeJS.Timeout;
        const heartbeatInterval = parseInt(process.env.STREAM_HEARTBEAT_INTERVAL_MS || '30000', 10);

        // Send heartbeat to prevent timeouts
        interval = setInterval(async () => {
            try {
                await stream.writeSSE({ event: 'ping', data: '' });
            } catch (e) {
                // connection likely closed
            }
        }, heartbeatInterval);

        // Wait until the stream is aborted
        await new Promise<void>((resolve) => {
            stream.onAbort(() => {
                connectedClients.delete(client);
                clearInterval(interval);
                resolve();
            });
        });
    });
};
