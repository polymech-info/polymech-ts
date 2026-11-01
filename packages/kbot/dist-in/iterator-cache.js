import { get_cached_object, set_cached_object, rm_cached_object } from "@polymech/cache";
import { Redis } from 'ioredis';
export const DEFAULT_CACHE_CONFIG = {
    enabled: true,
    provider: 'default',
    namespace: 'default-cache',
    expiration: 7 * 24 * 60 * 60 // 7 days in seconds
};
// --- Default Cache Provider (using @polymech/cache) ---
class DefaultCacheProvider {
    async get(key, namespace) {
        try {
            return await get_cached_object({ ca_options: key }, namespace);
        }
        catch (error) {
            console.error(`DefaultCache: Error getting cache for key ${JSON.stringify(key)} in namespace ${namespace}:`, error);
            return null;
        }
    }
    async set(key, namespace, value, options) {
        try {
            await set_cached_object({ ca_options: key }, namespace, value, options);
        }
        catch (error) {
            console.error(`DefaultCache: Error setting cache for key ${JSON.stringify(key)} in namespace ${namespace}:`, error);
        }
    }
    async delete(key, namespace) {
        try {
            await rm_cached_object({ ca_options: key }, namespace);
        }
        catch (error) {
            console.error(`DefaultCache: Error deleting cache for key ${JSON.stringify(key)} in namespace ${namespace}:`, error);
        }
    }
}
// --- Redis Cache Provider ---
class RedisCacheProvider {
    redis;
    constructor(redisUrl) {
        // Default to local instance if no URL is provided
        this.redis = new Redis(redisUrl || 'redis://localhost:6379');
        this.redis.on('error', (err) => console.error('Redis Client Error', err));
    }
    generateKey(key, namespace) {
        // Simple serialization; consider a more robust hashing function for complex keys
        return `${namespace}:${JSON.stringify(key)}`;
    }
    async get(key, namespace) {
        const redisKey = this.generateKey(key, namespace);
        try {
            const data = await this.redis.get(redisKey);
            return data ? JSON.parse(data) : null;
        }
        catch (error) {
            console.error(`RedisCache: Error getting cache for key ${redisKey}:`, error);
            return null;
        }
    }
    async set(key, namespace, value, options) {
        const redisKey = this.generateKey(key, namespace);
        try {
            const stringValue = JSON.stringify(value);
            if (options?.expiration) {
                await this.redis.set(redisKey, stringValue, 'EX', options.expiration);
            }
            else {
                await this.redis.set(redisKey, stringValue);
            }
        }
        catch (error) {
            console.error(`RedisCache: Error setting cache for key ${redisKey}:`, error);
        }
    }
    async delete(key, namespace) {
        const redisKey = this.generateKey(key, namespace);
        try {
            await this.redis.del(redisKey);
        }
        catch (error) {
            console.error(`RedisCache: Error deleting cache for key ${redisKey}:`, error);
        }
    }
    async disconnect() {
        await this.redis.quit();
    }
}
// --- Factory Function ---
let defaultCacheProviderInstance = null;
let redisCacheProviderInstance = null;
export function createCacheProvider(config) {
    const mergedConfig = { ...DEFAULT_CACHE_CONFIG, ...config };
    if (!mergedConfig.enabled) {
        // Return a dummy provider if caching is disabled
        return {
            get: async () => null,
            set: async () => { },
            delete: async () => { },
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaXRlcmF0b3ItY2FjaGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaXRlcmF0b3ItY2FjaGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLGlCQUFpQixFQUFFLGlCQUFpQixFQUFFLGdCQUFnQixFQUFFLE1BQU0saUJBQWlCLENBQUM7QUFDekYsT0FBTyxFQUFFLEtBQUssRUFBRSxNQUFNLFNBQVMsQ0FBQztBQWdCaEMsTUFBTSxDQUFDLE1BQU0sb0JBQW9CLEdBQTRDO0lBQ3pFLE9BQU8sRUFBRSxJQUFJO0lBQ2IsUUFBUSxFQUFFLFNBQVM7SUFDbkIsU0FBUyxFQUFFLGVBQWU7SUFDMUIsVUFBVSxFQUFFLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQyxvQkFBb0I7Q0FDcEQsQ0FBQztBQUVGLHlEQUF5RDtBQUV6RCxNQUFNLG9CQUFvQjtJQUN0QixLQUFLLENBQUMsR0FBRyxDQUFDLEdBQVcsRUFBRSxTQUFpQjtRQUNwQyxJQUFJLENBQUM7WUFDRCxPQUFPLE1BQU0saUJBQWlCLENBQUMsRUFBRSxVQUFVLEVBQUUsR0FBRyxFQUFFLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDbkUsQ0FBQztRQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7WUFDYixPQUFPLENBQUMsS0FBSyxDQUFDLDZDQUE2QyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsU0FBUyxHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDcEgsT0FBTyxJQUFJLENBQUM7UUFDaEIsQ0FBQztJQUNMLENBQUM7SUFFRCxLQUFLLENBQUMsR0FBRyxDQUFDLEdBQVcsRUFBRSxTQUFpQixFQUFFLEtBQVUsRUFBRSxPQUFpQztRQUNuRixJQUFJLENBQUM7WUFDRCxNQUFNLGlCQUFpQixDQUFDLEVBQUUsVUFBVSxFQUFFLEdBQUcsRUFBRSxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsT0FBTyxDQUFDLENBQUM7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