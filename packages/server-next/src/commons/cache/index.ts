import { CacheAdapter } from './types.js';
import { MemoryCache } from './MemoryCache.js';

// Design Pattern: Singleton or Factory
// For now, we export a singleton instance based on ENV or default to Memory
// Future: Read process.env.CACHE_PROVIDER == 'redis'

let instance: CacheAdapter | null = null;

export const getCache = (): CacheAdapter => {
    if (!instance) {
        instance = new MemoryCache();
    }
    return instance;
};

export * from './types.js';
export * from './MemoryCache.js';
