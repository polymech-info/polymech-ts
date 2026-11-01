import { createRoute, z } from '@hono/zod-openapi';

export const renderAstroPageRoute = createRoute({
    method: 'get',
    path: '/api/export/astro/{id}',
    request: {
        params: z.object({
            id: z.string()
        })
    },
    responses: {
        200: {
            description: 'Rendered Astro Page',
            content: {
                'text/plain': {
                    schema: z.string()
                }
            }
        },
        404: { description: 'Page not found' }
    }
});
