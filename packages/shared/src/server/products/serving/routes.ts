import { createRoute, z } from '@hono/zod-openapi';
import { Admin, Public } from '../../commons/decorators.js';

type ServiceRouteOptions = Parameters<typeof createRoute>[0] & {
    public?: boolean;
    admin?: boolean;
};

/**
 * Factory function to create a service route with optional decorators
 */
function createServiceRoute(options: ServiceRouteOptions) {
    const { public: isPublic, admin: isAdmin, ...routeDef } = options;
    let route = createRoute(routeDef);

    if (isPublic) {
        route = Public(route);
    }

    if (isAdmin) {
        route = Admin(route);
    }

    return route;
}

export function createRouteBody(
    method: string,
    path: string,
    tags: string[],
    summary: string,
    description: string,
    request: any,
    responses: any,
    publicRoute: boolean = true,
    adminRoute: boolean = false) {
    return createServiceRoute({
        method: method as any,
        path,
        tags,
        summary,
        description,
        request,
        responses,
        public: publicRoute,
        admin: adminRoute
    })
}

export const getFeedRoute = createRouteBody(
    'get',
    '/feed.xml',
    ['Serving'],
    'Get RSS Feed',
    'Returns the latest posts as an RSS 2.0 feed.',
    undefined,
    {
        200: {
            description: 'RSS Feed',
            content: {
                'application/xml': {
                    schema: z.string()
                }
            }
        }
    }
);

export const getMerchantFeedRoute = createRouteBody(
    'get',
    '/products.xml',
    ['Serving'],
    'Get Merchant Feed',
    'Returns the latest products as a Google Merchant XML feed.',
    undefined,
    {
        200: {
            description: 'XML Feed',
            content: {
                'application/xml': {
                    schema: z.string()
                }
            }
        }
    }
);

export const getLLMTextRoute = createRouteBody(
    'get',
    '/llms.txt',
    ['Serving'],
    'Get LLM Summary',
    'Returns a Markdown summary of content for AI agents.',
    undefined,
    {
        200: {
            description: 'Markdown Text',
            content: {
                'text/plain': {
                    schema: z.string()
                }
            }
        }
    }
);

export const getPostMetaRoute = createRouteBody(
    'get',
    '/post/:id',
    ['Serving'],
    'Get Post with Metadata',
    'Serves the React app HTML with injected Open Graph metadata for the specific post.',
    {
        params: z.object({
            id: z.string()
        })
    },
    {
        200: {
            description: 'HTML Page',
            content: {
                'text/html': {
                    schema: z.string()
                }
            }
        },
        404: {
            description: 'Post not found (Serves default HTML)',
        }
    }
);


export const getHomeRoute = createRouteBody(
    'get',
    '/',
    ['Serving'],
    'Get Home Page',
    'Serves the home page with injected feed data.',
    undefined,
    {
        200: {
            description: 'HTML Page',
            content: {
                'text/html': {
                    schema: z.string()
                }
            }
        }
    }
);

export const getProfilePageRoute = createRouteBody(
    'get',
    '/profile/:id',
    ['Serving'],
    'Get Profile Page',
    'Serves the profile page with injected profile data.',
    {
        params: z.object({
            id: z.string()
        })
    },
    {
        200: {
            description: 'HTML Page',
            content: {
                'text/html': {
                    schema: z.string()
                }
            }
        }
    }
);

export const getApiPostDetailsRoute = createRouteBody(
    'get',
    '/api/posts/:id',
    ['Posts'],
    'Get Post Details',
    'Get Post Details', // Missing description, reused summary
    {
        params: z.object({
            id: z.string()
        }),
        query: z.object({
            sizes: z.string().optional().openapi({ description: 'Responsive sizes' }),
            formats: z.string().optional().openapi({ description: 'Responsive formats' })
        })
    },
    {
        200: {
            description: 'Post Details',
            content: {
                'application/json': {
                    schema: z.any()
                }
            }
        },
        404: {
            description: 'Post not found'
        }
    },
    true
);

export const getApiFeedRoute = createRouteBody(
    'get',
    '/api/feed',
    ['Feed'],
    'Get JSON Feed',
    'Get JSON Feed', // Missing description
    {
        query: z.object({
            page: z.string().optional().default('0'),
            limit: z.string().optional().default('30'),
            source: z.string().optional().default('home').openapi({
                description: 'Feed source (home, user, etc)'
            }),
            sourceId: z.string().optional().openapi({
                description: 'ID for the source (userId, etc)'
            }),
            isOrgContext: z.enum(['true', 'false']).optional().openapi({
                description: 'Is Organization Context'
            }),
            orgSlug: z.string().optional().openapi({
                description: 'Organization Slug'
            }),
            cache: z.enum(['true', 'false']).optional().default('true').openapi({
                description: 'Set to false to bypass server cache'
            }),
            sizes: z.string().optional().openapi({
                description: 'Comma-separated list of widths (e.g. "320,640,1024"). Default: "[320, 640, 1024]"'
            }),
            formats: z.string().optional().openapi({
                description: 'Comma-separated list of formats (e.g. "avif,webp"). Default: "avif,webp"'
            })
        })
    },
    {
        200: {
            description: 'JSON Feed',
            content: {
                'application/json': {
                    schema: z.any()
                }
            }
        }
    },
    true // public
);

export const getProfileRoute = createRouteBody(
    'get',
    '/api/profile/:id',
    ['Users'],
    'Get Profile',
    'Get Profile',
    {
        params: z.object({
            id: z.string()
        })
    },
    {
        200: {
            description: 'Profile Data',
            content: {
                'application/json': {
                    schema: z.any()
                }
            }
        }
    },
    false // private
);

export const getSecretsRoute = createRouteBody(
    'get',
    '/api/me/secrets',
    ['Users'],
    'Get User Secrets',
    'Get User Secrets',
    undefined,
    {
        200: {
            description: 'User Secrets',
            content: {
                'application/json': {
                    schema: z.any()
                }
            }
        },
        401: {
            description: 'Unauthorized'
        }
    },
    false // private
);

export const postFlushCacheRoute = createRouteBody(
    'post',
    '/api/flush-cache',
    ['Posts'],
    'Flush Cache',
    'Flushes the server-side content cache and the disk-based image cache.',
    undefined,
    {
        200: {
            description: 'Cache Flushed',
            content: {
                'application/json': {
                    schema: z.object({
                        success: z.boolean(),
                        message: z.string()
                    })
                }
            }
        },
        500: {
            description: 'Internal Server Error'
        }
    },
    false, // not public
    true // admin
);

export const invalidateCacheRoute = createRouteBody(
    'post',
    '/api/cache/invalidate',
    ['System'],
    'Invalidate Cache by Path',
    'Invalidates cache keys matching the provided paths.',
    {
        body: {
            content: {
                'application/json': {
                    schema: z.object({
                        paths: z.array(z.string()).optional().openapi({
                            description: 'List of URL paths to invalidate (e.g. /api/user-page/123/slug)'
                        }),
                        types: z.array(z.string()).optional().openapi({
                            description: 'List of cache types to invalidate (e.g. posts, pages)'
                        })
                    })
                }
            }
        }
    },
    {
        200: {
            description: 'Cache Invalidated',
            content: {
                'application/json': {
                    schema: z.object({
                        success: z.boolean(),
                        count: z.number()
                    })
                }
            }
        }
    },
    false, // not public
    false // not admin-only (allow authed users to invalidate their own content ideally, for now just authed)
);

export const getProfilesRoute = createRouteBody(
    'get',
    '/api/profiles',
    ['Users'],
    'Get Batch Profiles',
    'Get Batch Profiles',
    {
        query: z.object({
            ids: z.string().openapi({
                description: 'Comma-separated list of user IDs'
            })
        })
    },
    {
        200: {
            description: 'Profiles Map',
            content: {
                'application/json': {
                    schema: z.record(z.string(), z.any())
                }
            }
        }
    },
    true // public
);

export const getApiMediaItemsRoute = createRouteBody(
    'get',
    '/api/media-items',
    ['Media'],
    'Get Media Items by IDs',
    'Fetches multiple media items by their IDs using server-side cache for optimal performance.',
    {
        query: z.object({
            ids: z.string().openapi({
                description: 'Comma-separated list of picture IDs'
            }),
            maintainOrder: z.enum(['true', 'false']).optional().openapi({
                description: 'Maintain the order of IDs in the response'
            }),
            sizes: z.string().optional().openapi({
                description: 'Comma-separated list of widths for responsive images'
            }),
            formats: z.string().optional().openapi({
                description: 'Comma-separated list of formats for responsive images'
            })
        })
    },
    {
        200: {
            description: 'Array of Media Items',
            content: {
                'application/json': {
                    schema: z.array(z.any())
                }
            }
        }
    },
    true // public
);






export const getEmbedRoute = createRouteBody(
    'get',
    '/embed/:id',
    ['Serving'],
    'Get Embed Page',
    'Serves the embed page with injected post data.',
    {
        params: z.object({
            id: z.string()
        })
    },
    {
        200: {
            description: 'HTML Page',
            content: {
                'text/html': {
                    schema: z.string()
                }
            }
        },
        404: {
            description: 'Post not found',
        }
    }
);



export const getSiteInfoRoute = createRouteBody(
    'get',
    '/api/serving/site-info',
    ['Serving'],
    'Get Site Information',
    'Extracts metadata (Open Graph, JSON-LD, etc.) from a given URL.',
    {
        query: z.object({
            url: z.string().openapi({
                description: 'The URL to extract information from',
                example: 'https://example.com'
            })
        })
    },
    {
        200: {
            description: 'Site Information',
            content: {
                'application/json': {
                    schema: z.object({
                        title: z.string().optional(),
                        description: z.string().optional(),
                        url: z.string().optional(),
                        siteName: z.string().optional(),
                        favicon: z.string().optional(),
                        og: z.record(z.string(), z.string().optional()).optional(),
                        images: z.array(z.object({
                            src: z.string(),
                            width: z.number().optional(),
                            height: z.number().optional(),
                            alt: z.string().optional()
                        })).optional(),
                        structuredData: z.array(z.any()).optional(),
                        social: z.array(z.object({
                            source: z.string(),
                            url: z.string()
                        })).optional()
                    })
                }
            }
        },
        400: {
            description: 'Invalid URL'
        },
        500: {
            description: 'Failed to extract information'
        }
    },
    true // public? Site info scraper is usually public
);

export const getSitemapRoute = createRouteBody(
    'get',
    '/sitemap-en.xml',
    ['Serving'],
    'Get Sitemap',
    'Returns the sitemap XML for internal pages.',
    undefined,
    {
        200: {
            description: 'Sitemap XML',
            content: {
                'application/xml': {
                    schema: z.string()
                }
            }
        }
    }
);