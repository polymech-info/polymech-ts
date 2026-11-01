import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { RouteHandler } from '@hono/zod-openapi';
import { boss } from '../jobs/boss/client.js';
import { QUEUE_MOCK_JOB } from '../jobs/boss/workers.js';
import { HonoEnv } from '../commons/types.js';

const tags = ['PgBoss'];

export const postBossJobRoute = createRoute({
    method: 'post',
    path: '/api/boss/job',
    tags,
    request: {
        body: {
            content: {
                'application/json': {
                    schema: z.object({
                        delayMs: z.number().default(100),
                        shouldFail: z.boolean().default(false),
                        retryLimit: z.number().optional()
                    }),
                },
            },
        },
    },
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: z.object({
                        jobId: z.string().nullable(),
                        message: z.string()
                    }),
                },
            },
            description: 'PgBoss job started',
        },
        500: {
            content: {
                'application/json': {
                    schema: z.object({ error: z.string() }),
                },
            },
            description: 'Server error',
        },
    },
});

export const postBossJobHandler: RouteHandler<typeof postBossJobRoute, HonoEnv> = async (c) => {
    if (!boss) {
        // Check if there was an initialization error we can report
        const { bossInitError } = await import('../jobs/boss/client.js');
        return c.json({ error: `PgBoss not initialized. Init error: ${bossInitError}` }, 500);
    }

    const { delayMs, shouldFail, retryLimit } = c.req.valid('json');
    const payload = { delayMs, shouldFail };
    const options = retryLimit !== undefined ? { retryLimit } : {};
    try {
        const jobId = await boss.send(QUEUE_MOCK_JOB, payload, options);
        return c.json({ jobId, message: 'Job submitted to PgBoss' }, 200);
    } catch (error: any) {
        return c.json({ error: error.message }, 500);
    }
};

export const getBossJobRoute = createRoute({
    method: 'get',
    path: '/api/boss/job/{id}',
    tags,
    request: {
        params: z.object({
            id: z.string(),
        }),
    },
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: z.object({
                        id: z.string(),
                        name: z.string(),
                        data: z.any(),
                        state: z.string(),
                        createdOn: z.string().optional(),
                        startedOn: z.string().optional(),
                        completedOn: z.string().optional(),
                    }),
                },
            },
            description: 'Job status',
        },
        404: {
            content: {
                'application/json': {
                    schema: z.object({ error: z.string() }),
                },
            },
            description: 'Job not found',
        },
        500: {
            content: {
                'application/json': {
                    schema: z.object({ error: z.string() }),
                },
            },
            description: 'Server error',
        },
    },
});

export const getBossJobHandler: RouteHandler<typeof getBossJobRoute, HonoEnv> = async (c) => {
    const { id } = c.req.valid('param');

    // Use pg directly to bypass PostgREST schema permissions
    const { Client } = await import('pg');
    const client = new Client({ connectionString: process.env.DATABASE_URL, });

    try {
        await client.connect();
        const result = await client.query('SELECT * FROM pgboss.job WHERE id = $1', [id]);
        const job = result.rows[0];

        if (!job) {
            return c.json({ error: 'Job not found' }, 404);
        }

        return c.json({
            id: job.id,
            name: job.name,
            data: job.data,
            state: job.state,
            createdOn: job.createdon,
            startedOn: job.startedon,
            completedOn: job.completedon,
            output: job.output,
        }, 200);
    } catch (error: any) {
        console.error('Error in getBossJobHandler:', error);
        return c.json({ error: error.message }, 500);
    } finally {
        await client.end().catch(() => { });
    }
};

export const cancelBossJobRoute = createRoute({
    method: 'post',
    path: '/api/boss/job/{id}/cancel',
    tags,
    request: {
        params: z.object({
            id: z.string(),
        }),
    },
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: z.object({ message: z.string() }),
                },
            },
            description: 'Job cancelled',
        },
        500: {
            content: {
                'application/json': {
                    schema: z.object({ error: z.string() }),
                },
            },
            description: 'Server error',
        },
    },
});

export const cancelBossJobHandler: RouteHandler<typeof cancelBossJobRoute, HonoEnv> = async (c) => {
    if (!boss) return c.json({ error: 'PgBoss not initialized' }, 500);
    const { id } = c.req.valid('param');
    try {
        await boss.cancel(QUEUE_MOCK_JOB, id);
        return c.json({ message: 'Job cancelled' }, 200);
    } catch (error: any) {
        return c.json({ error: error.message }, 500);
    }
};

export const resumeBossJobRoute = createRoute({
    method: 'post',
    path: '/api/boss/job/{id}/resume',
    tags,
    request: {
        params: z.object({
            id: z.string(),
        }),
    },
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: z.object({ message: z.string() }),
                },
            },
            description: 'Job resumed',
        },
        500: {
            content: {
                'application/json': {
                    schema: z.object({ error: z.string() }),
                },
            },
            description: 'Server error',
        },
    },
});

export const resumeBossJobHandler: RouteHandler<typeof resumeBossJobRoute, HonoEnv> = async (c) => {
    if (!boss) return c.json({ error: 'PgBoss not initialized' }, 500);
    const { id } = c.req.valid('param');
    try {
        await boss.resume(QUEUE_MOCK_JOB, id);
        return c.json({ message: 'Job resumed' }, 200);
    } catch (error: any) {
        return c.json({ error: error.message }, 500);
    }
};

export const completeBossJobRoute = createRoute({
    method: 'post',
    path: '/api/boss/job/{id}/complete',
    tags,
    request: {
        params: z.object({
            id: z.string(),
        }),
    },
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: z.object({ message: z.string() }),
                },
            },
            description: 'Job completed',
        },
        500: {
            content: {
                'application/json': {
                    schema: z.object({ error: z.string() }),
                },
            },
            description: 'Server error',
        },
    },
});

export const completeBossJobHandler: RouteHandler<typeof completeBossJobRoute, HonoEnv> = async (c) => {
    if (!boss) return c.json({ error: 'PgBoss not initialized' }, 500);
    const { id } = c.req.valid('param');
    try {
        await boss.complete(QUEUE_MOCK_JOB, id);
        return c.json({ message: 'Job completed' }, 200);
    } catch (error: any) {
        return c.json({ error: error.message }, 500);
    }
};

export const failBossJobRoute = createRoute({
    method: 'post',
    path: '/api/boss/job/{id}/fail',
    tags,
    request: {
        params: z.object({
            id: z.string(),
        }),
    },
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: z.object({ message: z.string() }),
                },
            },
            description: 'Job failed',
        },
        500: {
            content: {
                'application/json': {
                    schema: z.object({ error: z.string() }),
                },
            },
            description: 'Server error',
        },
    },
});

export const failBossJobHandler: RouteHandler<typeof failBossJobRoute, HonoEnv> = async (c) => {
    if (!boss) return c.json({ error: 'PgBoss not initialized' }, 500);
    const { id } = c.req.valid('param');
    try {
        await boss.fail(QUEUE_MOCK_JOB, id);
        return c.json({ message: 'Job failed' }, 200);
    } catch (error: any) {
        return c.json({ error: error.message }, 500);
    }
};
