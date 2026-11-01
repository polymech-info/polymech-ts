import React, { useEffect, useRef } from 'react';
import { FeedCard } from './FeedCard';
import { useAuth } from '@/hooks/useAuth';

import { Loader2 } from 'lucide-react';
import { useInView } from 'react-intersection-observer';
import { useFeedData, FeedSortOption } from '@/hooks/useFeedData';
import { useFeedCache } from '@/contexts/FeedCacheContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { FeedPost } from '@/modules/posts/client-posts';
import { T } from '@/i18n';

interface MobileFeedProps {
    source?: 'home' | 'collection' | 'tag' | 'user' | 'search';
    sourceId?: string;
    onNavigate?: (id: string) => void;
    sortBy?: FeedSortOption;
    categorySlugs?: string[];
    categoryIds?: string[];
    contentType?: 'posts' | 'pages' | 'pictures' | 'files' | 'places';
    visibilityFilter?: 'invisible' | 'private';
    center?: boolean;
    showTitle?: boolean;
    showDescription?: boolean;
    showAuthor?: boolean;
    showSocial?: boolean;
}

export const MobileFeed: React.FC<MobileFeedProps> = ({
    source = 'home',
    sourceId,
    onNavigate,
    sortBy = 'latest',
    categorySlugs,
    categoryIds,
    contentType,
    visibilityFilter,
    center,
    showTitle,
    showDescription,
    showAuthor = true,
    showSocial = true,
}) => {
    const { user } = useAuth();

    const { getCache, saveCache } = useFeedCache();
    const { orgSlug, isOrgContext } = useOrganization();

    // Use centralized feed hook
    const { posts, loading, error, hasMore } = useFeedData({
        source,
        sourceId,
        sortBy,
        categorySlugs,
        categoryIds,
        contentType,
        visibilityFilter
    });

    // Scroll Restoration Logic
    const cacheKey = `${source}-${sourceId || ''}-${isOrgContext ? 'org' : 'personal'}-${orgSlug || ''}`;
    const hasRestoredScroll = useRef(false);
    const lastScrollY = useRef(window.scrollY);

    // Track scroll position
    useEffect(() => {
        const handleScroll = () => {
            lastScrollY.current = window.scrollY;
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Restore scroll when posts are populated
    React.useLayoutEffect(() => {
        if (posts.length > 0 && !hasRestoredScroll.current) {
            const cached = getCache(cacheKey);
            if (cached && cached.scrollY > 0) {
                window.scrollTo(0, cached.scrollY);
            }
            hasRestoredScroll.current = true;
        }
    }, [posts, cacheKey, getCache]);

    // Save scroll position on unmount
    useEffect(() => {
        return () => {
            // We need to save the current state to cache
            // We can't easily get the *current* state of 'posts' inside this cleanup unless we use a ref or rely on the hook's cache
            // Actually, useFeedData already saves the data state. We just need to ensure scrollY is updated.
            // But useFeedData saves on render/update. 
            // Let's simply update the existing cache entry with the new scrollY
            const currentCache = getCache(cacheKey);
            if (currentCache && lastScrollY.current > 0) {
                saveCache(cacheKey, { ...currentCache, scrollY: lastScrollY.current });
            }
        };
    }, [cacheKey, getCache, saveCache]);


    // Preloading Logic
    // We simply use <link rel="preload"> or simple JS Image object creation
    // But efficiently we want to do it based on scroll position.

    // Simplest robust "Load 5 ahead" implementation:
    // We already have the URLs in `posts`.
    // We can observe the visible index and preload index + 1 to index + 5.

    // Intersection Observer for Virtual Window / Preload trigger
    // Since we don't have a truly huge list (yet), we will render the list 
    // but attach an observer to items to trigger preloading of subsequent items.

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 text-center text-red-500">
                Failed to load feed.
            </div>
        );
    }

    if (posts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <p>No posts yet.</p>
            </div>
        );
    }

    const isSearchTabAllOrFiles = source === 'search' && (!contentType || contentType === 'files');

    const renderItems = () => {
        if (!isSearchTabAllOrFiles) {
            return posts.map((post, index) => (
                <FeedItemWrapper
                    key={post.id}
                    post={post}
                    index={index}
                    posts={posts}
                    currentUser={user}
                    onNavigate={onNavigate}
                    showTitle={showTitle}
                    showDescription={showDescription}
                    showAuthor={showAuthor}
                    showSocial={showSocial}
                />
            ));
        }

        const getSearchGroup = (item: any): string => {
            if (item.type === 'page-vfs-folder') return 'Folders';
            if (item._searchSource === 'picture') return 'Pictures';
            if (item._searchSource === 'place') return 'Places';
            if (item._searchSource === 'file') {
                if (item.thumbnail_url || item.cover || (item.pictures && item.pictures.length > 0)) return 'Pictures';
                return 'Files';
            }
            if (item._searchSource === 'page') return 'Pages';
            if (item._searchSource === 'post') return 'Posts';
            return 'Posts';
        };

        const groups = new Map<string, any[]>();
        for (const post of posts) {
            const group = getSearchGroup(post);
            if (!groups.has(group)) groups.set(group, []);
            groups.get(group)!.push(post);
        }

        const orderedGroups = ['Pages', 'Folders', 'Posts', 'Places', 'Pictures', 'Files'];
        const elements: React.ReactNode[] = [];

        for (const group of orderedGroups) {
            if (groups.has(group)) {
                elements.push(
                    <div key={`group-${group}`} className="px-3 py-1.5 bg-muted/40 border-y text-xs font-semibold uppercase tracking-wider text-muted-foreground sticky top-0 z-10 backdrop-blur-md">
                        <T>{group}</T>
                    </div>
                );
                elements.push(
                    ...groups.get(group)!.map((post: any, index: number) => (
                        <FeedItemWrapper
                            key={post.id}
                            post={post}
                            index={index}
                            posts={posts}
                            currentUser={user}
                            onNavigate={onNavigate}
                            showTitle={showTitle}
                            showDescription={showDescription}
                            showAuthor={showAuthor}
                            showSocial={showSocial}
                        />
                    ))
                );
            }
        }

        return elements;
    };

    return (
        <div className={`w-full ${center ? 'max-w-3xl mx-auto' : ''}`}>
            {renderItems()}
        </div>
    );
};

// Wrapper directly handles visibility logic to trigger preloads
const FeedItemWrapper: React.FC<{
    post: FeedPost,
    index: number,
    posts: FeedPost[],
    currentUser: any,
    onNavigate?: (id: string) => void;
    showTitle?: boolean;
    showDescription?: boolean;
    showAuthor?: boolean;
    showSocial?: boolean;
}> = ({ post, index, posts, currentUser, onNavigate, showTitle, showDescription, showAuthor, showSocial }) => {
    const { ref } = useInView({
        triggerOnce: false,
        rootMargin: '200px 0px',
        threshold: 0.1
    });

    return (
        <div ref={ref}>
            <FeedCard
                post={post}
                currentUserId={currentUser?.id}
                onNavigate={onNavigate}
                showTitle={showTitle}
                showDescription={showDescription}
                showAuthor={showAuthor}
                showSocial={showSocial}
            />
        </div>
    );
};

export default MobileFeed;
