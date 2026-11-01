import { createRoute } from '@hono/zod-openapi';
import { LocationRequestSchema, LocationResponseSchema, LocationDetailResponseSchema } from './schemas.js';
import { Public } from '@/commons/decorators.js';
import { z } from 'zod';

import { authMiddleware, optionalAuthMiddleware } from '../../middleware/auth.js';

const tags = ['Locations'];

export const RequestSchema = z.object({
    query: z.string().default(''),
    location: z.string().optional().default('barcelona, spain'),
    refresh: z.string().optional().default('false'),
    filterCountry: z.string().optional(),
    filterCity: z.string().optional(),
    filterContinent: z.string().optional(),
    filterType: z.string().optional(),
    limit: z.string().optional().default('250'),
    zoom: z.string().optional().describe('Map zoom level'),
    excludedTypes: z.union([z.string(), z.array(z.string())]).optional().transform((val) => {
        if (!val) return undefined;
        if (typeof val === 'string') return [val];
        return val;
    }),
}).loose()

export type CompetitorRequest = z.infer<typeof RequestSchema>;

export const cancelJobRoute = createRoute({
    method: 'post',
    path: '/api/competitors/email/job/{jobId}/cancel',
    tags,
    middleware: [authMiddleware] as const,
    request: {
        params: z.object({
            jobId: z.string(),
        }),
    },
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: z.object({
                        message: z.string(),
                    }),
                },
            },
            description: 'Job cancelled successfully',
        },
        404: {
            description: 'Job not found',
        },
        500: {
            description: 'Server error',
        },
    },
});

export const getLocationsRoute = createRoute({
    method: 'get',
    path: '/api/competitors',
    tags,
    middleware: [authMiddleware] as const,
    request: {
        query: RequestSchema,
    },
    responses: {
        202: {
            content: {
                'application/json': {
                    schema: z.object({
                        message: z.string(),
                        jobId: z.string().nullable(),
                    }),
                },
            },
            description: 'Job submitted',
        },
        200: {
            content: {
                'application/json': {
                    schema: LocationResponseSchema,
                },
            },
            description: 'Retrieve locations (cached)',
        },
        500: {
            description: 'Server error',
        },
    },
});

export const getLocationsStreamRoute = createRoute({
    method: 'get',
    path: '/api/competitors/stream',
    tags,
    middleware: [authMiddleware] as const,
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
})

export const getCompetitorByIdRoute = Public(createRoute({
    method: 'get',
    path: '/api/competitors/{place_id}',
    tags,
    request: {
        params: z.object({
            place_id: z.string(),
        }),
    },
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: LocationDetailResponseSchema,
                },
            },
            description: 'Retrieve competitor details',
        },
        404: {
            description: 'Competitor not found',
        },
        500: {
            description: 'Server error',
        },
    },
}));

export const getLlmRegionInfoRoute = Public(createRoute({
    method: 'get',
    path: '/api/locations/llm-info',
    tags,
    request: {
        query: z.object({
            location: z.string().describe('Location name to get info for'),
        }),
    },
    responses: {
        200: {
            description: 'LLM Region Info',
            content: {
                'application/json': {
                    schema: z.object({
                        data: z.any(),
                    }),
                },
            },
        },
        500: {
            description: 'Server error',
        },
    },
}));

export const getFindEmailStreamRoute = createRoute({
    method: 'get',
    path: '/api/competitors/email/stream',
    tags,
    middleware: [authMiddleware] as const,
    request: {
        query: z.object({
            place_ids: z.string().describe('Comma-separated list of place IDs'),
            token: z.string().optional().describe('Auth token for SSE'),
        }),
    },
    responses: {
        200: {
            description: 'Server-Sent Events stream of email finding results',
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

export const getRegionSearchRoute = Public(createRoute({
    method: 'get',
    path: '/api/regions/search',
    tags,
    request: {
        query: z.object({
            query: z.string().describe('Region name to search for'),
            content_level: z.string().optional().describe('Filter by content level (e.g. 1)'),
            geojson: z.string().optional().describe('Include GeoJSON geometry (true/false)'),
        }),
    },
    responses: {
        200: {
            description: 'Search results',
            content: {
                'application/json': {
                    schema: z.object({
                        data: z.array(z.any()),
                    }),
                },
            },
        },
        500: {
            description: 'Server error',
        },
    },
}));

export const getRegionBoundaryRoute = Public(createRoute({
    method: 'get',
    path: '/api/regions/boundary/{id}',
    tags,
    request: {
        params: z.object({
            id: z.string().describe('GADM ID of the region'),
        }),
        query: z.object({
            name: z.string().optional().describe('Region Name (Required for GADM fetch)'),
            level: z.string().optional().describe('Content Level'),
        }),
    },
    responses: {
        200: {
            description: 'GeoJSON boundary',
            content: {
                'application/json': {
                    schema: z.object({
                        data: z.any(), // GeoJSON object
                    }),
                },
            },
        },
        404: {
            description: 'Region not found',
        },
        500: {
            description: 'Server error',
        },
    },
}));

export const getRegionReverseRoute = Public(createRoute({
    method: 'get',
    path: '/api/regions/reverse',
    tags,
    request: {
        query: z.object({
            lat: z.string().describe('Latitude'),
            lon: z.string().describe('Longitude'),
        }),
    },
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: z.object({
                        data: z.any().describe('Reverse geocoding result')
                    }),
                },
            },
            description: 'Reverse geocoding successful',
        },
        500: {
            content: {
                'application/json': {
                    schema: z.object({
                        error: z.string(),
                    }),
                },
            },
            description: 'Server error',
        },
    },
}));

export const getRegionNamesRoute = Public(createRoute({
    method: 'get',
    path: '/api/regions/names',
    tags,
    request: {
        query: z.object({
            admin: z.string().describe('Admin code (e.g. FRA, FRA.1_1)'),
            content_level: z.string().describe('Content level (e.g. 2)').default('2'),
        }),
    },
    responses: {
        200: {
            description: 'Region names results',
            content: {
                'application/json': {
                    schema: z.object({
                        data: z.array(z.any()),
                    }),
                },
            },
        },
        500: {
            description: 'Server error',
        },
    },
}));
export const getWikiSearchRoute = Public(createRoute({
    method: 'get',
    path: '/api/locations/wiki',
    tags,
    request: {
        query: z.object({
            lat: z.string().describe('Latitude'),
            lon: z.string().describe('Longitude'),
            radius: z.string().optional().default('10000').describe('Radius in meters (max 10000)'), // WP limit is usually 10000
            limit: z.string().optional().default('10').describe('Limit results'),
        }),
    },
    responses: {
        200: {
            description: 'Wiki geosearch results',
            content: {
                'application/json': {
                    schema: z.object({
                        data: z.array(z.any()),
                    }),
                },
            },
        },
        500: {
            description: 'Server error',
        },
    },
}));

export const getEnrichStreamRoute = createRoute({
    method: 'get',
    path: '/api/competitors/enrich/stream',
    tags,
    middleware: [authMiddleware] as const,
    request: {
        query: z.object({
            place_ids: z.string().describe('Comma-separated list of place IDs'),
            enrichers: z.string().describe('Comma-separated list of enrichers (e.g. meta)'),
        }),
    },
    responses: {
        200: {
            description: 'Server-Sent Events stream of enrichment results',
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
