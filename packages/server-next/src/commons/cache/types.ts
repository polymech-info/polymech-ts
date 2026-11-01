export interface CacheEntryInfo {
    key: string;
    remainingTTL: number;  // ms remaining, 0 = no TTL / infinite
    sizeEstimate?: number; // rough byte estimate if available
}

export interface CacheInfo {
    size: number;
    max: number;
    provider: string;
}

export interface CacheAdapter {
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T, ttl?: number): Promise<void>;
    del(key: string): Promise<void>;
    flush(pattern?: string): Promise<void>;
    keys(): string[];
    info(): CacheInfo;
    entries(): CacheEntryInfo[];
}
