import { createLogRoutes } from '@/commons/log-routes-factory.js';
import { createRoute, z } from '@hono/zod-openapi';
import { Public, Admin } from '../../commons/decorators.js';

export const { getRoute: getVideoLogsRoute, streamRoute: streamVideoLogsRoute } = createLogRoutes('Videos', '/api/videos/logs');

/**
 * Factory function to create a video service route with optional decorators
 */
function createRouteBody(
    method: string,
    path: string,
    tags: string[],
    summary: string,
    description: string,
    request: any,
    responses: any,
    publicRoute: boolean = false,
    adminRoute: boolean = false
) {
    let route = createRoute({
        method: method as any,
        path,
        tags,
        summary,
        description,
        request,
        responses
    });

    if (publicRoute) {
        route = Public(route);
    }

    if (adminRoute) {
        route = Admin(route);
    }

    return route;
}

export const postVideoRoute = createRouteBody(
    'post',
    '/api/videos',
    ['Videos'],
    'Process Video',
    'Starts a video processing job. Accepts either a file upload or URL.',
    {
        query: z.object({
            preset: z.string().optional().openapi({ example: 'web-720p' }),
            url: z.string().optional().openapi({ example: 'https://example.com/video.mp4' })
        }),
        body: {
            content: {
                'multipart/form-data': {
                    schema: z.object({
                        file: z.any().optional().openapi({ type: 'string', format: 'binary' }),
                    })
                },
                'application/json': {
                    schema: z.object({
                        url: z.string().optional()
                    })
                }
            }
        }
    },
    {
        202: {
            content: {
                'application/json': {
                    schema: z.object({
                        jobId: z.string(),
                        preset: z.string(),
                        message: z.string()
                    })
                }
            },
            description: 'Job Accepted'
        }
    },
    false // private - requires auth
);

export const uploadVideoRoute = createRouteBody(
    'post',
    '/api/videos/upload',
    ['Videos'],
    'Upload Video',
    'Uploads a video file, creates a database entry, and starts processing.',
    {
        query: z.object({
            preset: z.string().optional().openapi({ example: 'web-720p' }),
            userId: z.string().optional(),
            title: z.string().optional()
        }),
        body: {
            content: {
                'multipart/form-data': {
                    schema: z.object({
                        file: z.any().openapi({ type: 'string', format: 'binary' }),
                    })
                }
            }
        }
    },
    {
        200: {
            content: {
                'application/json': {
                    schema: z.object({
                        jobId: z.string(),
                        dbId: z.string(),
                        videoUrl: z.string(),
                        thumbnailUrl: z.string(),
                        meta: z.object({
                            duration: z.number().optional(),
                            width: z.number().optional(),
                            height: z.number().optional(),
                            format: z.string().optional()
                        }).optional()
                    })
                }
            },
            description: 'Video Uploaded and Database Entry Created'
        }
    },
    false // private - requires auth
);

export const getJobRoute = createRouteBody(
    'get',
    '/api/videos/jobs/{id}',
    ['Videos'],
    'Get Job Status',
    'Retrieves the status and details of a video processing job.',
    {
        params: z.object({
            id: z.string()
        })
    },
    {
        200: {
            content: {
                'application/json': {
                    schema: z.object({
                        id: z.string(),
                        status: z.string(),
                        progress: z.number(),
                        resultUrl: z.string().optional(),
                        error: z.string().optional()
                    })
                }
            },
            description: 'Job Status'
        },
        404: {
            description: 'Job not found'
        }
    },
    true // public - allow checking job status
);

export const getJobProgressRoute = createRouteBody(
    'get',
    '/api/videos/jobs/{id}/progress',
    ['Videos'],
    'Stream Job Progress',
    'Server-Sent Events stream of job progress updates.',
    {
        params: z.object({
            id: z.string().openapi({ param: { name: 'id', in: 'path' }, example: '123' })
        })
    },
    {
        200: {
            content: {
                'text/event-stream': {
                    schema: z.string()
                }
            },
            description: 'Job Progress SSE Stream'
        },
        404: {
            description: 'Job not found'
        }
    },
    true // public - allow streaming progress
);

export const downloadVideoRoute = createRouteBody(
    'get',
    '/api/videos/jobs/{id}/download',
    ['Videos'],
    'Download Processed Video',
    'Downloads the processed video file with range request support.',
    {
        params: z.object({
            id: z.string()
        })
    },
    {
        200: {
            description: 'Video File Stream'
        },
        206: {
            description: 'Partial Content (Range Request)'
        },
        404: {
            description: 'Not Found'
        }
    },
    true // public - allow downloading processed videos
);

export const getHlsPlaylistRoute = createRouteBody(
    'get',
    '/api/videos/jobs/{id}/hls/playlist.m3u8',
    ['Videos'],
    'Get HLS Playlist',
    'Retrieves the HLS master playlist for adaptive streaming.',
    {
        params: z.object({
            id: z.string()
        })
    },
    {
        200: {
            content: {
                'application/vnd.apple.mpegurl': {
                    schema: z.string()
                }
            },
            description: 'HLS Playlist'
        },
        404: {
            description: 'Not Found'
        }
    },
    true // public - HLS playlists need to be accessible for video playback
);

export const getHlsSegmentRoute = createRouteBody(
    'get',
    '/api/videos/jobs/{id}/hls/{segment}',
    ['Videos'],
    'Get HLS Segment',
    'Retrieves an HLS video segment for streaming.',
    {
        params: z.object({
            id: z.string(),
            segment: z.string()
        })
    },
    {
        200: {
            content: {
                'video/MP2T': {
                    schema: z.any()
                }
            },
            description: 'HLS Segment'
        },
        404: {
            description: 'Not Found'
        }
    },
    true // public - HLS segments need to be accessible for video playback
);

export const cancelJobRoute = createRouteBody(
    'delete',
    '/api/videos/jobs/{id}',
    ['Videos'],
    'Cancel Job',
    'Cancels a running video processing job.',
    {
        params: z.object({
            id: z.string()
        })
    },
    {
        200: {
            description: 'Job Cancelled'
        },
        404: {
            description: 'Job Not Found'
        }
    },
    false // private - only authenticated users can cancel jobs
);

export const proxyVideoRoute = createRouteBody(
    'get',
    '/api/videos/proxy',
    ['Videos'],
    'Proxy Video Stream',
    'Proxies video content from external URLs with CORS support.',
    {
        query: z.object({
            url: z.string().openapi({ example: 'https://generativelanguage.googleapis.com/...' })
        })
    },
    {
        200: {
            description: 'Video Stream (Proxy)'
        },
        400: {
            description: 'Missing URL'
        },
        500: {
            description: 'Proxy Error'
        }
    },
    true // public - allow proxying external videos
);
