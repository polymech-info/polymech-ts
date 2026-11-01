import React, { createContext, useContext, useRef, useCallback } from 'react';
import { FeedPost } from '@/lib/db';

interface FeedCacheState {
    posts: FeedPost[];
    page: number;
    hasMore: boolean;
    scrollY: number;
    timestamp: number;
}

interface FeedCacheContextType {
    saveCache: (key: string, state: Omit<FeedCacheState, 'timestamp'>) => void;
    getCache: (key: string) => FeedCacheState | null;
    clearCache: (key?: string) => void;
}

const FeedCacheContext = createContext<FeedCacheContextType | null>(null);

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const FeedCacheProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const cache = useRef<Map<string, FeedCacheState>>(new Map());

    const saveCache = useCallback((key: string, state: Omit<FeedCacheState, 'timestamp'>) => {

        cache.current.set(key, { ...state, timestamp: Date.now() });
    }, []);

    const getCache = useCallback((key: string) => {
        const item = cache.current.get(key);
        if (!item) {
            return null;
        }

        if (Date.now() - item.timestamp > CACHE_TTL) {

            cache.current.delete(key);
            return null;
        }


        return item;
    }, []);

    const clearCache = useCallback((key?: string) => {
        if (key) {
            cache.current.delete(key);
        } else {
            cache.current.clear();
        }
    }, []);

    return (
        <FeedCacheContext.Provider value={{ saveCache, getCache, clearCache }}>
            {children}
        </FeedCacheContext.Provider>
    );
};

export const useFeedCache = () => {
    const context = useContext(FeedCacheContext);
    if (!context) {
        throw new Error('useFeedCache must be used within a FeedCacheProvider');
    }
    return context;
};
