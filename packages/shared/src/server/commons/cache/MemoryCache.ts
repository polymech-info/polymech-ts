import { LRUCache } from 'lru-cache';
import { CacheAdapter } from './types.js';

export class MemoryCache implements CacheAdapter {
    private cache: LRUCache<string, any>;

    constructor() {
        const defaultTtl = process.env.CACHE_DEFAULT_TTL ? parseInt(process.env.CACHE_DEFAULT_TTL) : 1000 * 60 * 5; // 5 mins default
        this.cache = new LRUCache({
            max: 1000,
            ttl: defaultTtl,
            updateAgeOnGet: false,
        });
    }

    async get<T>(key: string): Promise<T | null> {
        const value = this.cache.get(key);
        return (value as T) || null;
    }

    async set<T>(key: string, value: T, ttl?: number): Promise<void> {
        this.cache.set(key, value, { ttl: ttl ? ttl * 1000 : undefined });
    }

    async del(key: string): Promise<void> {
        this.cache.delete(key);
    }

    async flush(pattern?: string): Promise<void> {
        if (pattern) {
            // Support simple wildcard patterns (e.g. "home-feed*", "*-feed*")
            // Escape special regex chars except *, then replace * with .*
            const regexPattern = pattern
                .replace(/[.+^${}()|[\]\\]/g, '\\$&') // Escape regex chars
                .replace(/\*/g, '.*');                 // Convert * to .*

            const regex = new RegExp(`^${regexPattern}$`);

            for (const key of this.cache.keys()) {
                if (typeof key === 'string' && regex.test(key)) {
                    this.cache.delete(key);
                }
            }
        } else {
            this.cache.clear();
        }
    }
}
