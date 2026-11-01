import { get_cached_object, set_cached_object, rm_cached_object } from "@polymech/cache";
import { Redis } from 'ioredis';

export interface CacheProvider {
    get(key: object, namespace: string): Promise<any | null>;
    set(key: object, namespace: string, value: any, options?: { expiration?: number }): Promise<void>;
    delete(key: object, namespace: string): Promise<void>;
}

export interface CacheConfig {
    enabled?: boolean;
    provider?: 'default' | 'redis';
    namespace?: string;
    expiration?: number; // in seconds
    redisUrl?: string; // e.g., 'redis://localhost:6379'
}

export const DEFAULT_CACHE_CONFIG: Required<Omit<CacheConfig, 'redisUrl'>> = {
    enabled: true,
    provider: 'default',
    namespace: 'default-cache',
    expiration: 7 * 24 * 60 * 60 // 7 days in seconds
};

// --- Default Cache Provider (using @polymech/cache) ---

class DefaultCacheProvider implements CacheProvider {
    async get(key: object, namespace: string): Promise<any | null> {
        try {
            return await get_cached_object({ ca_options: key }, namespace);
        } catch (error) {
            console.error(`DefaultCache: Error getting cache for key ${JSON.stringify(key)} in namespace ${namespace}:`, error);
            return null;
        }
    }

    async set(key: object, namespace: string, value: any, options?: { expiration?: number }): Promise<void> {
        try {
            await set_cached_object({ ca_options: key }, namespace, value, options);
        } catch (error) {
            console.error(`DefaultCache: Error setting cache for key ${JSON.stringify(key)} in namespace ${namespace}:`, error);
        }
    }

    async delete(key: object, namespace: string): Promise<void> {
        try {
            await rm_cached_object({ ca_options: key }, namespace);
        } catch (error) {
            console.error(`DefaultCache: Error deleting cache for key ${JSON.stringify(key)} in namespace ${namespace}:`, error);
        }
    }
}

// --- Redis Cache Provider ---

class RedisCacheProvider implements CacheProvider {
    private redis: Redis;

    constructor(redisUrl?: string) {
        // Default to local instance if no URL is provided
        this.redis = new Redis(redisUrl || 'redis://localhost:6379');
        this.redis.on('error', (err) => console.error('Redis Client Error', err));
    }

    private generateKey(key: object, namespace: string): string {
        // Simple serialization; consider a more robust hashing function for complex keys
        return `${namespace}:${JSON.stringify(key)}`;
    }

    async get(key: object, namespace: string): Promise<any | null> {
        const redisKey = this.generateKey(key, namespace);
        try {
            const data = await this.redis.get(redisKey);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error(`RedisCache: Error getting cache for key ${redisKey}:`, error);
            return null;
        }
    }

    async set(key: object, namespace: string, value: any, options?: { expiration?: number }): Promise<void> {
        const redisKey = this.generateKey(key, namespace);
        try {
            const stringValue = JSON.stringify(value);
            if (options?.expiration) {
                await this.redis.set(redisKey, stringValue, 'EX', options.expiration);
            } else {
                await this.redis.set(redisKey, stringValue);
            }
        } catch (error) {
            console.error(`RedisCache: Error setting cache for key ${redisKey}:`, error);
        }
    }

    async delete(key: object, namespace: string): Promise<void> {
        const redisKey = this.generateKey(key, namespace);
        try {
            await this.redis.del(redisKey);
        } catch (error) {
            console.error(`RedisCache: Error deleting cache for key ${redisKey}:`, error);
        }
    }

    async disconnect(): Promise<void> {
        await this.redis.quit();
    }
}

// --- Factory Function ---

let defaultCacheProviderInstance: CacheProvider | null = null;
let redisCacheProviderInstance: CacheProvider | null = null;

export function createCacheProvider(config?: CacheConfig): CacheProvider {
    const mergedConfig = { ...DEFAULT_CACHE_CONFIG, ...config }; 

    if (!mergedConfig.enabled) {
        // Return a dummy provider if caching is disabled
        return {
            get: async () => null,
            set: async () => {},
            delete: async () => {},
        };
    }

    if (mergedConfig.provider === 'redis') {
        if (!redisCacheProviderInstance) {
             // Pass redisUrl if provided in config
            redisCacheProviderInstance = new RedisCacheProvider(config?.redisUrl); 
        }
        return redisCacheProviderInstance;
    }

    // Default provider
    if (!defaultCacheProviderInstance) {
        defaultCacheProviderInstance = new DefaultCacheProvider();
    }
    return defaultCacheProviderInstance;
} 