
import { createRoute, z } from '@hono/zod-openapi';

export const renderPdfRoute = createRoute({
    method: 'get',
    path: '/api/render/pdf/:id',
    tags: ['PDF'],
    summary: 'Render Post PDF',
    description: 'Generates and downloads a custom PDF for the specified post.',
    request: {
        params: z.object({
            id: z.string().openapi({
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
            description: 'PDF File',
            content: {
                'application/pdf': {
                    schema: z.string().openapi({ format: 'binary' }),
                },
            },
        },
        404: {
            description: 'Post not found',
        },
    },
});

export const renderPdfPageRoute = createRoute({
    method: 'get',
    path: '/api/render/pdf/page/:id',
    tags: ['PDF'],
    summary: 'Render Page PDF',
    description: 'Generates and downloads a custom PDF for the specified page.',
    request: {
        params: z.object({
            id: z.string().openapi({
                param: {
                    name: 'id',
                    in: 'path',
                },
                example: 'page-uuid',
            }),
        }),
    },
    responses: {
        200: {
            description: 'PDF File',
            content: {
                'application/pdf': {
                    schema: z.string().openapi({ format: 'binary' }),
                },
            },
        },
        404: {
            description: 'Page not found',
        },
    },
});

export const getProbeRoute = createRoute({
    method: 'get',
    path: '/api/pdf/probe',
    tags: ['PDF'],
    summary: 'Probe PDF Service',
    description: 'Checks if the PDF service is active.',
    responses: {
        200: {
            description: 'OK',
            content: {
                'text/plain': {
                    schema: z.string()
                }
            }
        }
    }
});
