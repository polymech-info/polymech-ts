import { PublicEndpointRegistry, AdminEndpointRegistry } from './registry.js';
import { logger } from './logger.js';

/**
 * Decorator/Wrapper to mark an endpoint as public
 * Registers the route in PublicEndpointRegistry
 */
export function Public<T extends { method: string, path: string }>(route: T): T {
    PublicEndpointRegistry.register(route.path, route.method);
    return route;
}

/**
 * Decorator/Wrapper to mark an endpoint as admin-only
 * Registers the route in AdminEndpointRegistry
 */
export function Admin<T extends { method: string, path: string }>(route: T): T {
    AdminEndpointRegistry.register(route.path, route.method);
    return route;
}

/**
 * Class Decorator: Registers the worker queue name
 */
export function Worker(queueName: string) {
    return function <T extends { new(...args: any[]): any }>(constructor: T) {
        // We can't easily access the instance method 'handler' here without instantiating
        // So we assume the class has a 'handler' method or we register the class itself
        // For simplicity, let's assume we'll instantiate it later or the registry handles it.
        // But wait, pg-boss needs a function.
        // Let's store the constructor in the registry, and the registry (or bootstrap) will instantiate and bind.

        // Actually, let's just attach the queue name to the class for now, 
        // and let a separate scanner or manual registration use it.
        // OR, we can register a factory.

        // Better approach for now: Register the prototype's handler if it exists.
        // But 'handler' is on the instance usually.

        // Let's just modify the class to have a static 'queueName' property
        // and register it.
        (constructor as any).queueName = queueName;
    };
}

import { Context } from 'hono';
import { getCache } from './cache/index.js';

type KeyGenerator = (c: Context) => string;

const defaultKeyInfo = (c: Context) => {
    const url = new URL(c.req.url);
    url.searchParams.sort();
    return `auto-cache:${c.req.method}:${url.pathname}${url.search}`;
};

export const CachedHandler = (
    handler: (c: Context) => Promise<Response>,
    options?: {
        ttl?: number,
        keyGenerator?: KeyGenerator,
        skipAuth?: boolean, // Default true
        varyByAuth?: boolean, // If true, includes auth token in key and disables skipAuth default
        maxSizeBytes?: number // Default: 1MB
    }
) => async (c: Context) => {
    const opts = options || {};
    const ttl = opts.ttl || 300;
    const varyByAuth = opts.varyByAuth || false;
    const skipAuth = opts.skipAuth !== undefined ? opts.skipAuth : !varyByAuth; // Default true unless varyByAuth is true
    const maxSizeBytes = opts.maxSizeBytes || 1024 * 1024; // 1MB
    const keyGen = opts.keyGenerator || defaultKeyInfo;

    // 1. Auth Bypass
    const authHeader = c.req.header('Authorization');
    if (skipAuth && authHeader) {
        // Explicitly mark as skipped due to auth
        c.header('X-Cache', 'SKIP');
        return handler(c);
    }

    const cache = getCache();
    let key = keyGen(c);

    // Append Auth to key if requested (User Isolation)
    if (varyByAuth && authHeader) {
        key += `|auth=${authHeader}`;
    }
    const bypass = c.req.query('cache') === 'false' || c.req.query('nocache') === 'true';

    // 2. Hit
    if (!bypass) {
        const cached = await cache.get(key);
        if (cached) {
            c.header('X-Cache', 'HIT');
            const cachedVal = cached as any;
            if (cachedVal.contentType) c.header('Content-Type', cachedVal.contentType);
            if (varyByAuth) c.header('Vary', 'Authorization');
            return c.body(cachedVal.data);
        }
    }

    // 3. Miss
    const response = await handler(c);

    // 4. Save
    if (response instanceof Response && response.ok) {
        const cloned = response.clone();
        try {
            const contentType = response.headers.get('Content-Type') || 'application/json';
            let data: any;

            // Check content length if available
            const contentLength = cloned.headers.get('Content-Length');
            if (contentLength && parseInt(contentLength) > maxSizeBytes) {
                return response;
            }

            if (contentType.includes('application/json')) {
                const jsonObj = await cloned.json();
                data = JSON.stringify(jsonObj);
            } else {
                data = await cloned.text();
            }

            // Double check actual size after reading
            if (data.length > maxSizeBytes) {
                return response;
            }

            await cache.set(key, { data, contentType }, ttl);
            c.header('X-Cache', bypass ? 'BYPASS' : 'MISS');
            if (varyByAuth) c.header('Vary', 'Authorization');
        } catch (e) {
            logger.error({ err: e }, 'Cache interception failed');
        }
    }

    return response;
}

