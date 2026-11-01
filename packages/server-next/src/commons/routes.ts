import { createRoute, z } from '@hono/zod-openapi';
import { Public, Admin } from '@/commons/decorators.js';

/**
 * Factory function to create a location service route with optional decorators
 */
export function createRouteBody(
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

