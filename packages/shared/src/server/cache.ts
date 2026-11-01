import { getCache } from './commons/cache/index.js';
import { appEvents } from './events.js';
import { logger } from './commons/logger.js';


export class AppCache {
    private static instance: AppCache;

    // Dependencies: key -> [dependencies]
    // Defines what each type DEPENDS ON.
    // If 'categories' changes, any type that has 'categories' in its dependency list must be invalidated.
    private static DEPENDENCIES: Record<string, string[]> = {
        'posts': ['categories'],
        'pages': ['categories']
    };

    private constructor() { }

    public static getInstance(): AppCache {
        if (!AppCache.instance) {
            AppCache.instance = new AppCache();
        }
        return AppCache.instance;
    }

    public async get<T>(type: string): Promise<T | null> {
        const cache = getCache();
        const val = await cache.get<T>(type);
        // logger.info({ type, hit: !!val }, 'AppCache.get');
        return val;
    }

    public async set<T>(type: string, data: T, ttl?: number): Promise<void> {
        const cache = getCache();
        await cache.set(type, data, ttl);
        // logger.info({ type, ttl }, 'AppCache.set');
    }

    public async invalidate(type: string): Promise<void> {
        const cache = getCache();

        // 1. Invalidate the requested type
        await cache.del(type);

        // Notify system
        appEvents.emitUpdate(type, 'delete', { type }, 'cache');

        // 2. Find types that depend on this type
        // (i.e. find keys in DEPENDENCIES where the value array contains 'type')
        const dependents = Object.keys(AppCache.DEPENDENCIES).filter(key =>
            AppCache.DEPENDENCIES[key].includes(type)
        );

        if (dependents.length > 0) {
            logger.info({ type, dependents }, 'AppCache.invalidate dependents');
            // Recursively invalidate dependents
            await Promise.all(dependents.map(dep => this.invalidate(dep)));
        }
    }

    public async flush(pattern?: string): Promise<void> {
        const cache = getCache();
        await cache.flush(pattern);

        // Notify system
        appEvents.emitUpdate('system', 'delete', { pattern: pattern || 'all' }, 'cache');
    }
}

export const appCache = AppCache.getInstance();
