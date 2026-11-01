import { Context, Next } from 'hono';
import { securityLogger as logger } from '../commons/logger.js';
import { PublicEndpointRegistry, AdminEndpointRegistry } from '../commons/registry.js';
import { getUserCached } from '../commons/zitadel.js';
import { isAdmin as isUserAdminRole } from '../commons/postgres.js';


/**
 * Strict authentication middleware – requires a valid Bearer token.
 */
export async function authMiddleware(c: Context, next: Next) {
    const authHeader = c.req.header('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return c.json({ error: 'Unauthorized - Missing or invalid authorization header' }, 401);
    }
    const token = authHeader.substring(7);
    try {
        const user = await getUserCached(token);
        if (!user) {
            return c.json({ error: 'Invalid or expired token' }, 401);
        }
        c.set('userId', user.id);
        c.set('user', user);
        c.set('userEmail', user.email);
        await next();
    } catch (err) {
        logger.error({ err }, 'Auth middleware error');
        return c.json({ error: 'Authentication failed' }, 401);
    }
}

/**
 * Optional authentication middleware.
 * - Public endpoint: GET /api/products (no auth required).
 * - Otherwise respects REQUIRE_AUTH flag, but skips auth in test/dev environments.
 */
export async function optionalAuthMiddleware(c: Context, next: Next) {
    const path = c.req.path;
    const method = c.req.method;

    // Public endpoint – allow unauthenticated access
    const isPublicEndpoint = PublicEndpointRegistry.isPublic(path, method);
    const isProductsEndpoint = method === 'GET' && path === '/api/products';
    if (isProductsEndpoint || isPublicEndpoint) {
        return await next();
    }

    const requireAuth = process.env.REQUIRE_AUTH === 'true';
    const isTestEnv = false; // process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development';
    const authHeader = c.req.header('authorization');

    // If no auth header, or it's not a Bearer token...
    let token: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
    } else {
        // Check for token in query param (for SSE)
        const queryToken = c.req.query('token');
        if (queryToken) {
            token = queryToken;
        }
    }

    if (!token) {
        // ...and we are in test env or auth not required, just continue.
        if (!requireAuth) {
            return await next();
        }
        // ...otherwise reject
        return c.json({ error: 'Unauthorized' }, 401);
    }

    try {
        const user = await getUserCached(token);
        if (!user) {
            logger.warn('[Auth] Token verification failed');
            if (isTestEnv) {
                return await next();
            }
            return c.json({ error: 'Unauthorized' }, 401);
        }
        c.set('userId', user.id);
        c.set('user', user);
        c.set('userEmail', user.email);
        await next();
    } catch (err) {
        logger.error({ err }, '[Auth] Optional auth middleware error - REJECTING');
        return c.json({ error: 'Authentication failed' }, 401);
    }
}

/**
 * Admin‑only middleware – requires authentication and admin role.
 * Checks AdminEndpointRegistry to see if the route requires admin access.
 */
export async function adminMiddleware(c: Context, next: Next) {
    const path = c.req.path;
    const method = c.req.method;

    // Check if this is an admin endpoint
    if (!AdminEndpointRegistry.isAdmin(path, method)) {
        return await next();
    }

    // If it is an admin endpoint, enforce auth and role
    const userId = c.get('userId');
    if (!userId) {
        return c.json({ error: 'Unauthorized - Authentication required' }, 401);
    }
    try {
        if (!(await isUserAdminRole(userId))) {
            return c.json({ error: 'Forbidden - Admin access required' }, 403);
        }
        c.set('isAdmin', true);
        await next();
    } catch (err) {
        logger.error({ err }, 'Admin middleware error');
        return c.json({ error: 'Authorization check failed' }, 500);
    }
}

