import { trackUsage, updateUsageRecord } from '../middleware/usageTracking.js';
import { FunctionRegistry, PublicEndpointRegistry, AdminEndpointRegistry } from './registry.js';
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

export interface BillableContext {
    userId: string;
    jobId: string;
    signal?: AbortSignal;
    metadata?: Record<string, any>;
}

export interface BillableOptions {
    productId: string;
    actionId: string;
    cancellable?: boolean;
}

/**
 * Decorator to mark a method as billable
 * Handles usage tracking, context injection, and cancellation
 */
export function Billable(options: BillableOptions) {
    return function (
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor
    ) {
        const originalMethod = descriptor.value;

        descriptor.value = async function (...args: any[]) {
            // 1. Extract context
            // Assumes the first argument is BillableContext, or it's part of the first argument object
            let context: BillableContext | undefined;

            if (args.length > 0 && typeof args[0] === 'object') {
                // Check if first arg is context
                if ('userId' in args[0] && 'jobId' in args[0]) {
                    context = args[0] as BillableContext;
                }
            }

            if (!context) {
                // If no context provided, we can't track usage properly
                // For now, we'll log a warning and proceed without tracking
                // In strict mode, we might want to throw an error
                logger.warn(`[Billable] No context provided for ${options.productId}:${options.actionId}`);
                return originalMethod.apply(this, args);
            }

            // 2. Get config
            const config = FunctionRegistry.get(options.productId, options.actionId);
            if (!config) {
                logger.warn(`[Billable] No config found for ${options.productId}:${options.actionId}`);
                return originalMethod.apply(this, args);
            }

            // 3. Start tracking
            const usageId = await trackUsage({
                userId: context.userId,
                endpoint: 'function', // Internal function call
                method: 'CALL',
                product: options.productId,
                action: options.actionId,
                costUnits: config.costUnits,
                cancellable: options.cancellable || false,
                jobId: context.jobId,
                metadata: context.metadata
            });

            const startTime = Date.now();
            let error: Error | null = null;
            let result: any;

            try {
                // 4. Execute method
                // If cancellable, we should ideally wrap the execution or check signal
                if (options.cancellable && context.signal) {
                    if (context.signal.aborted) {
                        throw new Error('Operation cancelled');
                    }

                    // Add abort listener
                    context.signal.addEventListener('abort', () => {
                        logger.info(`[Billable] Job ${context?.jobId} aborted via signal`);
                    });
                }

                result = await originalMethod.apply(this, args);
                return result;
            } catch (err) {
                error = err as Error;
                throw err;
            } finally {
                // 5. End tracking
                if (usageId) {
                    const endTime = Date.now();
                    await updateUsageRecord({
                        usageId,
                        responseStatus: error ? 500 : 200,
                        responseTimeMs: endTime - startTime,
                        error
                    });
                }
            }
        };

        return descriptor;
    };
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

