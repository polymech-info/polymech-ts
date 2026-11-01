import { useState, useEffect, useCallback, useRef } from 'react';
import { FEED_API_ENDPOINT, FEED_PAGE_SIZE } from '@/constants';
import { useProfiles } from '@/contexts/ProfilesContext';
import { useFeedCache } from '@/contexts/FeedCacheContext';
import { augmentFeedPosts, FeedPost } from '@/modules/posts/client-posts';
import { searchContent, searchContentStream } from '@/modules/search/client-search';
import { getCurrentLang } from '@/i18n';
import { fetchWithDeduplication, getAuthToken } from '@/lib/db';
import { fetchFeed } from '@/modules/feed/client-feed';

export type FeedSortOption = 'latest' | 'top';

interface UseFeedDataProps {
    source?: 'home' | 'collection' | 'tag' | 'user' | 'widget' | 'search';
    sourceId?: string;
    isOrgContext?: boolean;
    orgSlug?: string;
    enabled?: boolean;
    sortBy?: FeedSortOption;
    categoryIds?: string[];
    categorySlugs?: string[];
    contentType?: 'posts' | 'pages' | 'pictures' | 'files' | 'places';
    visibilityFilter?: 'invisible' | 'private';
}

export const useFeedData = ({
    source = 'home',
    sourceId,
    isOrgContext,
    orgSlug,
    enabled = true,
    sortBy = 'latest',
    categoryIds,
    categorySlugs,
    contentType,
    visibilityFilter
}: UseFeedDataProps) => {
    const { getCache, saveCache } = useFeedCache();
    const categoryKey = categoryIds ? `-catIds${categoryIds.join(',')}` : '';
    const slugKey = categorySlugs ? `-catSlugs${categorySlugs.join(',')}` : '';
    const contentTypeKey = contentType ? `-ct${contentType}` : '';
    const visibilityKey = visibilityFilter ? `-vis${visibilityFilter}` : '';
    const cacheKey = `${source}-${sourceId || ''}-${isOrgContext ? 'org' : 'personal'}-${orgSlug || ''}-${sortBy}${categoryKey}${slugKey}${contentTypeKey}${visibilityKey}`;

    // Initialize from cache if available
    const [posts, setPosts] = useState<FeedPost[]>(() => {
        const cached = getCache(cacheKey);
        return cached ? cached.posts : [];
    });
    const [page, setPage] = useState(() => {
        const cached = getCache(cacheKey);
        return cached ? cached.page : 0;
    });
    const [hasMore, setHasMore] = useState(() => {
        const cached = getCache(cacheKey);
        return cached !== null ? cached.hasMore : true;
    });
    const [loading, setLoading] = useState(() => {
        const cached = getCache(cacheKey);
        return cached ? false : true;
    });

    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const { fetchProfiles } = useProfiles();

    // Keep track of active stream for search
    const streamRef = useRef<(() => void) | null>(null);

    // Track if we mounted with cache to avoid double fetch
    const mountedWithCache = useRef(!!getCache(cacheKey));

    // Reset pagination when source changes (if not cached)
    useEffect(() => {
        const cached = getCache(cacheKey);
        if (cached) {
            setPosts(cached.posts);
            setPage(cached.page);
            setHasMore(cached.hasMore);
            setLoading(false);
            mountedWithCache.current = true;
        } else {
            setPosts([]);
            setPage(0);
            setHasMore(true);
            setLoading(true);
            mountedWithCache.current = false;
        }
    }, [source, sourceId, isOrgContext, orgSlug, cacheKey, getCache]);

    // Update Cache whenever state changes
    useEffect(() => {
        if (!loading && posts.length > 0) {
            const currentCache = getCache(cacheKey);
            saveCache(cacheKey, {
                posts,
                page,
                hasMore,
                scrollY: currentCache?.scrollY || 0
            });
        }
    }, [posts, page, hasMore, loading, cacheKey, saveCache, getCache]);

    const loadFeed = useCallback(async (currentPage: number, isLoadMore: boolean) => {
        if (!enabled) {
            setLoading(false);
            return;
        }
        if (isLoadMore) {
            setIsFetchingMore(true);
        } else {
            setLoading(true);
        }
        setError(null);
        let fetchedPosts: any[] = [];
        try {
            // 0. Search source — use streaming API
            if (source === 'search' && sourceId) {
                const session = { access_token: await getAuthToken() };

                // Close any existing stream
                if (streamRef.current) {
                    streamRef.current();
                    streamRef.current = null;
                }

                // First clear existing posts if it's a new search
                if (!isLoadMore) {
                    setPosts([]);
                }

                setHasMore(false); // Search returns all results, no pagination

                await new Promise<void>((resolve, reject) => {
                    let firstChunkReceived = false;
                    let currentStreamedPosts: any[] = [];

                    streamRef.current = searchContentStream({
                        q: sourceId,
                        limit: 50,
                        type: contentType ? contentType as any : undefined,
                        token: session?.access_token || undefined,
                        visibilityFilter: visibilityFilter || undefined
                    }, (hits) => {
                        currentStreamedPosts = [...currentStreamedPosts, ...hits];

                        // Process and update state
                        const augmentedPosts = augmentFeedPosts(currentStreamedPosts);
                        const postsWithUpdatedCovers = updatePostCovers(augmentedPosts, sortBy);
                        setPosts(sortFeedPosts(postsWithUpdatedCovers, sortBy));

                        // Fetch profiles for new hits
                        const userIds = Array.from(new Set(hits.map((p: any) => p.user_id)));
                        if (userIds.length > 0) {
                            fetchProfiles(userIds as string[]);
                        }

                        // Resolve promise on first chunk so loading spinner hides
                        if (!firstChunkReceived) {
                            firstChunkReceived = true;
                            resolve();
                        }
                    }, (err) => {
                        console.error('Stream failed:', err);
                        if (!firstChunkReceived) reject(err);
                    }, () => {
                        setHasMore(false);
                        if (!firstChunkReceived) resolve(); // Resolve even if empty
                    });
                });
                return; // Early return as search updates state directly
            } else {
                const hasFilters = (categoryIds && categoryIds.length > 0) || (categorySlugs && categorySlugs.length > 0) || contentType || visibilityFilter;

                if (source === 'home' && !sourceId && !hasFilters && currentPage === 0 && window.__INITIAL_STATE__?.feed) {
                    fetchedPosts = window.__INITIAL_STATE__.feed;
                    window.__INITIAL_STATE__.feed = undefined;
                } else {
                    // 2. API Fetch (Universal)
                    const dedupKey = `feed-${cacheKey}-p${currentPage}`;

                    fetchedPosts = await fetchWithDeduplication(
                        dedupKey,
                        () => fetchFeed({
                            source: source,
                            sourceId: sourceId,
                            page: currentPage,
                            limit: FEED_PAGE_SIZE,
                            sortBy: sortBy,
                            categoryIds: categoryIds,
                            categorySlugs: categorySlugs,
                            contentType: contentType,
                            visibilityFilter: visibilityFilter,
                            lang: getCurrentLang()
                        })
                    );
                }

                if (fetchedPosts.length < FEED_PAGE_SIZE) {
                    setHasMore(false);
                } else {
                    setHasMore(true);
                }
            } // end else (non-search)

            // Augment posts (ensure cover, author profiles etc are set)
            const augmentedPosts = augmentFeedPosts(fetchedPosts);

            // Update cover based on sort mode
            const postsWithUpdatedCovers = updatePostCovers(augmentedPosts, sortBy);

            // Apply client-side sorting
            setPosts(prev => {
                const combined = isLoadMore ? [...prev, ...postsWithUpdatedCovers] : postsWithUpdatedCovers;
                // Re-sort the entire combined list to maintain correct order across pages
                return sortFeedPosts(combined, sortBy);
            });

            // Fetch profiles via context for any users in the feed
            const userIds = Array.from(new Set(augmentedPosts.map((p: any) => p.user_id)));
            if (userIds.length > 0) {
                await fetchProfiles(userIds as string[]);
            }

        } catch (err) {
            setError(err instanceof Error ? err : new Error('Unknown error fetching feed'));
        } finally {
            setLoading(false);
            setIsFetchingMore(false);
        }
    }, [source, sourceId, isOrgContext, orgSlug, enabled, fetchProfiles, sortBy, categoryIds, categorySlugs, contentType, visibilityFilter]);

    // Initial Load
    useEffect(() => {
        // If we initialized from cache, don't fetch page 0 again immediately.
        if (mountedWithCache.current) {
            mountedWithCache.current = false;
            return;
        }
        loadFeed(0, false);
    }, [loadFeed]);

    const loadMore = useCallback(() => {
        if (!hasMore || isFetchingMore || loading) return;
        const nextPage = page + 1;
        setPage(nextPage);
        loadFeed(nextPage, true);
    }, [hasMore, isFetchingMore, loading, page, loadFeed]);

    // Cleanup stream on unmount
    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current();
                streamRef.current = null;
            }
        };
    }, []);

    return { posts, loading, error, hasMore, loadMore, isFetchingMore };
};

// Helper function to update post covers based on sort mode
const updatePostCovers = (posts: FeedPost[], sortBy: FeedSortOption): FeedPost[] => {
    return posts.map(post => {
        if (!post.pictures || post.pictures.length === 0) {
            return post;
        }

        const validPics = post.pictures.filter((p: any) => p.visible !== false);
        if (validPics.length === 0) {
            return post;
        }

        let newCover;
        if (sortBy === 'latest') {
            // For "Latest" mode: prefer is_selected, then first by position
            const selected = validPics.find((p: any) => p.is_selected);
            const sortedByPosition = [...validPics].sort((a, b) => (a.position || 0) - (b.position || 0));
            newCover = selected || sortedByPosition[0];
        } else {
            // For "Top" or default: Use first by position
            const sortedByPosition = [...validPics].sort((a, b) => (a.position || 0) - (b.position || 0));
            newCover = sortedByPosition[0];
        }

        return {
            ...post,
            cover: newCover
        };
    });
};

// Helper function to sort feed posts
const sortFeedPosts = (posts: FeedPost[], sortBy: FeedSortOption): FeedPost[] => {
    const sorted = [...posts];

    if (sortBy === 'top') {
        // Sort by likes_count descending, then by created_at descending as tiebreaker
        sorted.sort((a, b) => {
            const likesA = a.likes_count || 0;
            const likesB = b.likes_count || 0;

            if (likesB !== likesA) {
                return likesB - likesA;
            }

            // Tiebreaker: most recent first
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
    } else {
        // 'latest' - Sort by post creation date (most recent first)
        sorted.sort((a, b) => {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
    }

    return sorted;
};
