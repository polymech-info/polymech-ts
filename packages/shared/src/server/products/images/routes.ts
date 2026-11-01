import { createRoute, z } from '@hono/zod-openapi';
import { createLogRoutes } from '../../commons/log-routes-factory.js';

export const { getRoute: getImageLogsRoute, streamRoute: streamImageLogsRoute } = createLogRoutes('Images', '/api/images/logs');

export const postImageRoute = createRoute({
    method: 'post',
    path: '/api/images',
    tags: ['Images'],
    summary: 'Upload and resize image',
    description: 'Upload an image and get a resized version via redirect.',
    request: {
        query: z.object({
            preset: z.string().optional().openapi({ description: 'Predefined preset (e.g., desktop:thumb)' }),
            forward: z.string().optional().openapi({ description: 'Forward to external storage (e.g., supabase)' }),
            cache: z.string().optional().default('true').openapi({ description: 'Use cache (true/false)' })
        }),
        body: {
            content: {
                'multipart/form-data': {
                    schema: z.object({
                        file: z.any().openapi({
                            type: 'string',
                            format: 'binary',
                            description: 'Image file'
                        }),
                        width: z.string().optional(),
                        height: z.string().optional(),
                        format: z.string().optional(),
                    })
                }
            }
        }
    },
    responses: {
        303: {
            description: 'Redirect to processed image (local cache)',
        },
        200: {
            description: 'Image processed and uploaded',
            content: {
                'application/json': {
                    schema: z.object({
                        url: z.string(),
                        width: z.number().optional(),
                        height: z.number().optional(),
                        format: z.string().optional(),
                        size: z.number().optional(),
                        filename: z.string().optional()
                    })
                }
            }
        },
        500: {
            description: 'Server error',
        }
    }
});

export const getImageRoute = createRoute({
    method: 'get',
    path: '/api/images/cache/:filename',
    tags: ['Images'],
    summary: 'Get cached image',
    description: 'Serving processed images from cache map.',
    request: {
        params: z.object({
            filename: z.string()
        })
    },
    responses: {
        200: {
            description: 'Image file',
        },
        404: {
            description: 'Not found',
        }
    }
});

export const postResponsiveImageRoute = createRoute({
    method: 'post',
    path: '/api/images/responsive',
    tags: ['Images'],
    summary: 'Generate responsive images',
    description: 'Upload an image and get a list of responsive versions.',
    request: {
        body: {
            content: {
                'multipart/form-data': {
                    schema: z.object({
                        file: z.any().openapi({
                            type: 'string',
                            format: 'binary',
                            description: 'Image file'
                        }),
                        sizes: z.string().optional().openapi({ description: 'JSON array of widths, e.g. [640, 1024]' }),
                        formats: z.string().optional().openapi({ description: 'JSON array of formats, e.g. ["webp", "jpg"]' }),
                    })
                }
            }
        }
    },
    responses: {
        200: {
            description: 'Responsive images generated',
            content: {
                'application/json': {
                    schema: z.object({
                        img: z.object({
                            src: z.string(),
                            width: z.number(),
                            height: z.number(),
                            format: z.string(),
                        }),
                        sources: z.array(z.object({
                            srcset: z.string(),
                            type: z.string()
                        }))
                    })
                }
            }
        },
        303: {
            description: 'Redirect to cached image',
        },
        500: {
            description: 'Server error',
        }
    }
});

export const renderImageRoute = createRoute({
    method: 'get',
    path: '/api/images/render',
    tags: ['Images'],
    summary: 'Render lazy-optimized image',
    description: 'Fetch, resize, and serve an image from a remote URL. Intended for use in srcSet.',
    request: {
        query: z.object({
            url: z.string().openapi({ description: 'Remote URL to fetch' }),
            width: z.string().optional().openapi({ description: 'Target width' }),
            height: z.string().optional().openapi({ description: 'Target height' }),
            format: z.string().optional().openapi({ description: 'Output format (jpeg, webp, etc.)' })
        })
    },
    responses: {
        200: {
            description: 'Image content',
            content: {
                'image/*': {
                    schema: z.string().openapi({ format: 'binary' })
                }
            }
        },
        500: {
            description: 'Server error'
        }
    }
});



export const postTransformRoute = createRoute({
    method: 'post',
    path: '/api/images/transform',
    tags: ['Images'],
    summary: 'Transform image',
    description: 'Apply operations (resize, crop, rotate) to an uploaded image.',
    request: {
        body: {
            content: {
                'multipart/form-data': {
                    schema: z.object({
                        file: z.any().openapi({
                            type: 'string',
                            format: 'binary',
                            description: 'Image file'
                        }),
                        operations: z.string().openapi({
                            description: 'JSON array of operations: [{ type: "rotate", angle: 90 }, { type: "resize", width: 100 }, { type: "crop", x: 0, y: 0, width: 100, height: 100 }]'
                        })
                    })
                }
            }
        }
    },
    responses: {
        200: {
            description: 'Transformed image',
            content: {
                'image/*': {
                    schema: z.string().openapi({ format: 'binary' })
                }
            }
        },
        500: {
            description: 'Server error',
        }
    }
});
