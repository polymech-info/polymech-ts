import { getCache } from './commons/cache/index.js';
import { appEvents } from './events.js';
import { CacheEntryInfo, CacheInfo } from './commons/cache/types.js';
import pino from 'pino';
import path from 'path';

const logFile = path.join(process.cwd(), 'logs', 'cache.json');

const fileTransport = pino.transport({
    target: 'pino/file',
    options: { destination: logFile, mkdir: true }
});

export const cacheLogger = pino(
    {
        level: process.env.PINO_LOG_LEVEL || 'info',
        base: { product: 'cache' },
        timestamp: pino.stdTimeFunctions.isoTime,
    },
    pino.multistream([
        { stream: fileTransport, level: 'info' }
    ])
);


export class AppCache {
    private static instance: AppCache;

    // Dependencies: key -> [dependencies]
    // Defines what each type DEPENDS ON.
    // If 'categories' changes, any type that has 'categories' in its dependency list must be invalidated.
    private static DEPENDENCIES: Record<string, string[]> = {
        'posts': ['categories', 'pictures'], // posts depend on categories and pictures
        'pages': ['categories', 'pictures', 'translations'],
        'categories': ['types'],
        'translations': [], // widget/category translations (wt:* keys)
        'feed': ['posts', 'pages', 'categories'],
        'auth': [] // No dependencies, standalone
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
        return val;
    }

    public async set<T>(type: string, data: T, ttl?: number): Promise<void> {
        const cache = getCache();
        await cache.set(type, data, ttl);
    }

    /**
     * Silent cache invalidation — clears cache for the given type and
     * cascades to dependents. Does NOT emit SSE events.
     * Use `notify()` in route handlers for explicit SSE.
     */
    public async invalidate(type: string, preventMirror: boolean = false): Promise<void> {
        const cache = getCache();

        if (type === 'feed') {
            await cache.flush('*-feed*');
            await cache.flush('home-feed*');
        } else if (type === 'translations') {
            await cache.flush('wt:*');
            await cache.flush('page-details-*');
        } else {
            await cache.del(type);
        }

        if (!preventMirror) {
            import('./mirror.js').then(m => m.mirrorInvalidateCache([type], [])).catch(err => {
                cacheLogger.error({ err }, 'Failed to invoke mirrorInvalidateCache');
            });
        }

        // Find types that depend on this type
        const dependents = Object.keys(AppCache.DEPENDENCIES).filter(key =>
            AppCache.DEPENDENCIES[key].includes(type)
        );

        cacheLogger.info({ type, dependents, preventMirror }, 'Cache invalidated');

        if (dependents.length > 0) {
            await Promise.all(dependents.map(dep => this.invalidate(dep, true)));
        }
    }

    /**
     * Flush cache entries by pattern. Silent — no SSE.
     */
    public async flush(pattern?: string): Promise<void> {
        const cache = getCache();
        await cache.flush(pattern);
        cacheLogger.info({ pattern: pattern || 'all' }, 'Cache flushed');
    }

    /**
     * Emit exactly 1 SSE event to notify clients of a change.
     * Call this in route handlers AFTER cache invalidation.
     *
     * @param type - Entity type (e.g. 'post', 'page', 'category', 'picture')
     * @param id - Entity ID (null for list-level / system changes)
     * @param action - The mutation that occurred
     */
    public notify(type: string, id: string | null, action: 'create' | 'update' | 'delete'): void {
        cacheLogger.info({ type, id, action }, 'Cache notify');
        appEvents.emitUpdate(type, action, { id }, 'cache');
    }

    public inspect(): { info: CacheInfo; dependencies: Record<string, string[]>; entries: CacheEntryInfo[] } {
        const cache = getCache();
        return {
            info: cache.info(),
            dependencies: AppCache.DEPENDENCIES,
            entries: cache.entries(),
        };
    }
}

export const appCache = AppCache.getInstance();
