export interface CacheProvider {
    get(key: object, namespace: string): Promise<any | null>;
    set(key: object, namespace: string, value: any, options?: {
        expiration?: number;
    }): Promise<void>;
    delete(key: object, namespace: string): Promise<void>;
}
export interface CacheConfig {
    enabled?: boolean;
    provider?: 'default' | 'redis';
    namespace?: string;
    expiration?: number;
    redisUrl?: string;
}
export declare const DEFAULT_CACHE_CONFIG: Required<Omit<CacheConfig, 'redisUrl'>>;
export declare function createCacheProvider(config?: CacheConfig): CacheProvider;
