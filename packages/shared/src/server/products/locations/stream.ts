import { createRoute, RouteHandler } from '@hono/zod-openapi';
import { streamSSE } from 'hono/streaming';
import { LocationRequestSchema } from './schemas.js';
import { searchLocations } from './jobs-find.js';
import { get_cached, params_hash } from './cache.js';
import { HonoEnv } from '@/commons/types.js';
import { logger } from './logger.js';

const tags = ['Locations'];

export const getLocationsStreamRoute = createRoute({
    method: 'get',
    path: '/api/locations/stream',
    tags,
    request: {
        query: LocationRequestSchema,
    },
    responses: {
        200: {
            description: 'Server-Sent Events stream of location results',
            content: {
                'text/event-stream': {
                    schema: {
                        type: 'string'
                    }
                }
            }
        },
        500: {
            description: 'Server error',
        },
    },
});

export const stream_get: RouteHandler<typeof getLocationsStreamRoute, HonoEnv> = async (c) => {
    const query = c.req.valid('query');
    const { refresh } = query;
    const forceRefresh = refresh === 'true';
    const userId = c.get('userId');

    if (!userId) {
        logger.error('Unauthorized : no userId');
        return c.json({ message: 'Unauthorized' }, 401);
    }

    const inputHash = params_hash({ query: query.query, location: query.location });

    return streamSSE(c, async (stream) => {
        try {
            await stream.writeSSE({
                event: 'progress',
                data: JSON.stringify({ stage: 'starting', percent: 0 })
            });

            if (!forceRefresh) {
                await stream.writeSSE({
                    event: 'progress',
                    data: JSON.stringify({ stage: 'checking_cache', percent: 10 })
                });

                const cached = await get_cached(inputHash);
                if (cached) {
                    for (let i = 0; i < cached.length; i++) {
                        await stream.writeSSE({
                            event: 'result',
                            data: JSON.stringify(cached[i])
                        });
                    }
                    await stream.writeSSE({
                        event: 'complete',
                        data: JSON.stringify({ total: cached.length, cached: true })
                    });
                    return;
                }
            }

            await stream.writeSSE({
                event: 'progress',
                data: JSON.stringify({ stage: 'fetching_from_api', percent: 20 })
            });

            // Note: searchLocations currently awaits all results. 
            // Ideally, we would refactor searchLocations to yield results or accept a callback.
            // For now, we fetch all then stream.
            const results = await searchLocations(query as any, userId);

            for (let i = 0; i < results.length; i++) {
                await stream.writeSSE({
                    event: 'result',
                    data: JSON.stringify(results[i])
                });
            }

            await stream.writeSSE({
                event: 'complete',
                data: JSON.stringify({ total: results.length, cached: false })
            });

        } catch (error: any) {
            logger.error(error, 'Stream error');
            await stream.writeSSE({
                event: 'error',
                data: JSON.stringify({ error: error.message || 'Internal Server Error' })
            });
        }
    });
};
