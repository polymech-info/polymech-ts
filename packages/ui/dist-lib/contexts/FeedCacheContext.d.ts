import { default as React } from 'react';
import { FeedPost } from '../lib/db';
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
export declare const FeedCacheProvider: React.FC<{
    children: React.ReactNode;
}>;
export declare const useFeedCache: () => FeedCacheContextType;
export {};
