
import { createRoute, z } from '@hono/zod-openapi';

export const renderEmailRoute = createRoute({
    method: 'get',
    path: '/api/render/email/:id',
    tags: ['Email'],
    summary: 'Render Email HTML',
    description: 'Generates email HTML for the specified post.',
    request: {
        params: z.object({
            id: z.string().uuid().openapi({
                param: {
                    name: 'id',
                    in: 'path',
                },
                example: 'd5d1e9fc-8e0c-49d9-8a0e-78f637b47935',
            }),
        }),
    },
    responses: {
        200: {
            description: 'Email HTML',
            content: {
                'text/html': {
                    schema: z.string(),
                },
            },
        },
        404: {
            description: 'Post not found',
        },
    },
});

export const sendEmailRoute = createRoute({
    method: 'post',
    path: '/api/send/email/:id',
    tags: ['Email'],
    summary: 'Send Email',
    description: 'Generates and sends an email for the specified post.',
    request: {
        params: z.object({
            id: z.string().uuid().openapi({
                param: {
                    name: 'id',
                    in: 'path',
                },
                example: 'd5d1e9fc-8e0c-49d9-8a0e-78f637b47935',
            }),
        }),
        body: {
            content: {
                'application/json': {
                    schema: z.object({
                        to: z.string().email().optional(),
                        subject: z.string().optional(),
                        html: z.string().optional()
                    })
                }
            }
        }
    },
    responses: {
        200: {
            description: 'Email sent successfully',
            content: {
                'application/json': {
                    schema: z.object({
                        success: z.boolean(),
                        messageId: z.string().optional()
                    }),
                },
            },
        },
        404: {
            description: 'Post not found',
        },
        500: {
            description: 'Failed to send email'
        }
    },
});
