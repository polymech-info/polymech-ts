import { FeedPost } from '../lib/db';
export type FeedSortOption = 'latest' | 'top';
interface UseFeedDataProps {
    source?: 'home' | 'collection' | 'tag' | 'user';
    sourceId?: string;
    isOrgContext?: boolean;
    orgSlug?: string;
    enabled?: boolean;
    sortBy?: FeedSortOption;
    supabaseClient?: any;
}
export declare const useFeedData: ({ source, sourceId, isOrgContext, orgSlug, enabled, sortBy, supabaseClient }: UseFeedDataProps) => {
    posts: FeedPost[];
    loading: boolean;
    error: Error;
    hasMore: boolean;
    loadMore: () => void;
    isFetchingMore: boolean;
};
export {};
