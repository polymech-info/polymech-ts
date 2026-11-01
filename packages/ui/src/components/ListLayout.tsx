
import React, { useState, useEffect } from "react";
import { useFeedData, FeedSortOption } from "@/hooks/useFeedData";

import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate, Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { MessageCircle, Heart, ExternalLink } from "lucide-react";
import UserAvatarBlock from "@/components/UserAvatarBlock";
import { Button } from "@/components/ui/button";
import { T } from "@/i18n";
const Post = React.lazy(() => import("@/modules/posts/PostPage"));
const UserPage = React.lazy(() => import("@/modules/pages/UserPage"));

interface ListLayoutProps {
    sortBy?: FeedSortOption;
    navigationSource?: 'home' | 'collection' | 'tag' | 'user' | 'search';
    navigationSourceId?: string;
    isOwner?: boolean; // Not strictly used for rendering list but good for consistency
    categorySlugs?: string[];
    categoryIds?: string[];
    contentType?: 'posts' | 'pages' | 'pictures' | 'files' | 'places';
    visibilityFilter?: 'invisible' | 'private';
    center?: boolean;
    preset?: any;
}

const ListItem = ({ item, isSelected, onClick, preset }: { item: any, isSelected: boolean, onClick: () => void, preset?: any }) => {
    const isExternal = item.type === 'page-external';
    const domain = isExternal && item.meta?.url ? new URL(item.meta.url).hostname : null;

    return (
        <div
            className={`p-3 border-b flex items-start gap-3 cursor-pointer hover:bg-muted/50 transition-colors ${isSelected ? 'bg-muted border-l-4 border-l-primary' : ''}`}
            onClick={onClick}
        >
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-foreground">
                        {item.title || "Untitled"}
                    </h3>
                    {domain && (
                        <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                            <ExternalLink className="h-3 w-3" />
                            {domain}
                        </span>
                    )}
                </div>

                {preset?.showDescription !== false && item.description && (
                    <div className="text-xs text-muted-foreground line-clamp-3 mb-2">
                        {item.description}
                    </div>
                )}

                {(preset?.showAuthor !== false || preset?.showActions !== false) && (
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {preset?.showAuthor !== false && (
                            <>
                                <div className="flex items-center gap-1.5 min-w-0" onClick={(e) => { e.stopPropagation(); }}>
                                    <UserAvatarBlock
                                        userId={item.user_id || item.author?.id}
                                        avatarUrl={item.author?.avatar_url}
                                        displayName={item.author?.username}
                                        className="w-5 h-5"
                                        showDate={false}
                                        hoverStyle={false}
                                        textSize="xs"
                                    />
                                </div>
                                <span>{formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}</span>
                            </>
                        )}

                        {preset?.showActions !== false && (
                            <div className="flex items-center gap-3 ml-auto">
                                {(item.likes_count || 0) >= 10 && (
                                    <span className="flex items-center gap-1">
                                        <Heart className="h-3 w-3" />
                                        {item.likes_count}
                                    </span>
                                )}
                                {((item.comments && item.comments[0]?.count) || 0) >= 10 && (
                                    <span className="flex items-center gap-1">
                                        <MessageCircle className="h-3 w-3" />
                                        {(item.comments && item.comments[0]?.count) || 0}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Thumbnail for quick context */}
            {/* Thumbnail for quick context */}
            <div className="w-16 h-16 shrink-0 rounded-md overflow-hidden bg-muted">
                {item.thumbnail_url || item.cover?.image_url || item.pictures?.[0]?.image_url ? (
                    <img
                        src={item.thumbnail_url || item.cover?.image_url || item.pictures?.[0]?.image_url}
                        alt=""
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
                        <div className="w-4 h-4 rounded-full border-2 border-current opacity-20" />
                    </div>
                )}
            </div>
        </div>
    );
};

const getSearchGroup = (post: any): string => {
    if (post.type === 'page-vfs-folder') return 'Folders';
    if (post._searchSource === 'picture') return 'Pictures';
    if (post._searchSource === 'place') return 'Places';
    if (post._searchSource === 'file') {
        if (post.thumbnail_url || post.cover || (post.pictures && post.pictures.length > 0)) return 'Pictures';
        return 'Files';
    }
    if (post._searchSource === 'page') return 'Pages';
    if (post._searchSource === 'post') return 'Posts';
    return 'Posts';
};

export const ListLayout = ({
    sortBy = 'latest',
    navigationSource = 'home',
    navigationSourceId,
    categorySlugs,
    categoryIds,
    contentType,
    visibilityFilter,
    center,
    preset
}: ListLayoutProps) => {
    const navigate = useNavigate();
    const isMobile = useIsMobile();
    // State for desktop selection
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const {
        posts: feedPosts,
        loading,
        hasMore,
        loadMore
    } = useFeedData({
        source: navigationSource,
        sourceId: navigationSourceId,
        sortBy,
        categorySlugs,
        categoryIds,
        contentType,
        visibilityFilter
    });

    const handleItemClick = (item: any) => {
        if (item.meta?.url) {
            navigate(item.meta.url);
            return;
        }

        if (isMobile) {
            const slug = item.meta?.slug || item.cover?.meta?.slug || item.pictures?.[0]?.meta?.slug;
            if (item.type === 'page-intern' && slug) {
                const usernameOrId = item.author?.username || item.user_id;
                navigate(`/user/${usernameOrId}/pages/${slug}`);
            } else {
                navigate(`/post/${item.id}`);
            }
        } else {
            setSelectedId(item.id);
        }
    };

    // Keyboard navigation
    useEffect(() => {
        if (isMobile || !selectedId) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                const currentIndex = feedPosts.findIndex((p: any) => p.id === selectedId);
                if (currentIndex === -1) return;

                let newIndex = currentIndex;
                if (e.key === 'ArrowDown' && currentIndex < feedPosts.length - 1) {
                    newIndex = currentIndex + 1;
                } else if (e.key === 'ArrowUp' && currentIndex > 0) {
                    newIndex = currentIndex - 1;
                }

                if (newIndex !== currentIndex) {
                    setSelectedId((feedPosts[newIndex] as any).id);
                    // Ensure the list item is visible
                    const element = document.getElementById(`list-item-${(feedPosts[newIndex] as any).id}`);
                    //  element?.scrollIntoView({ block: 'nearest' });
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedId, feedPosts, isMobile]);

    // Reset selection when category changes (must run before auto-select below, or it clears the first item)
    useEffect(() => {
        setSelectedId(null);
    }, [categorySlugs?.join(',')]);

    // Select first item by default on desktop if nothing selected
    useEffect(() => {
        if (!isMobile && !selectedId && feedPosts.length > 0) {
            setSelectedId((feedPosts[0] as any).id);
        }
    }, [feedPosts, isMobile, selectedId]);

    if (loading && feedPosts.length === 0) {
        return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
    }

    if (feedPosts.length === 0) {
        return <div className="p-8 text-center text-muted-foreground">No posts found.</div>;
    }

    const renderItems = (isMobileView: boolean) => {
        const shouldGroup = navigationSource === 'search' && (!contentType || contentType === 'files');

        if (!shouldGroup) {
            return feedPosts.map((post: any) => (
                <div key={post.id} id={!isMobileView ? `list-item-${post.id}` : undefined}>
                    <ListItem
                        item={post}
                        isSelected={!isMobileView && selectedId === post.id}
                        onClick={() => handleItemClick(post)}
                        preset={preset}
                    />
                </div>
            ));
        }

        const groups = new Map<string, any[]>();
        for (const post of feedPosts) {
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
                    ...groups.get(group)!.map((post: any) => (
                        <div key={post.id} id={!isMobileView ? `list-item-${post.id}` : undefined}>
                            <ListItem
                                item={post}
                                isSelected={!isMobileView && selectedId === post.id}
                                onClick={() => handleItemClick(post)}
                                preset={preset}
                            />
                        </div>
                    ))
                );
            }
        }

        return elements;
    };

    if (!isMobile) {
        // Desktop Split Layout
        return (
            <div
                className={`flex h-full min-h-0 w-full min-w-0 max-h-full flex-1 basis-0 overflow-hidden border rounded-lg shadow-sm dark:bg-slate-900/10 ${center ? 'max-w-7xl mx-auto' : ''}`}
            >
                {/* Left: list scrolls independently from detail pane */}
                <div className="flex h-full min-h-0 max-h-full w-[350px] shrink-0 flex-col overflow-hidden border-r bg-card lg:w-[400px]">
                    <div className="relative min-h-0 flex-1 overflow-y-auto overscroll-y-contain scrollbar-custom">
                        {renderItems(false)}
                        {hasMore && (
                            <div className="p-4 text-center">
                                <Button variant="ghost" size="sm" onClick={() => loadMore()}>Load More</Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: detail scrolls independently (post / page / place handle their own overflow) */}
                <div className="relative flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background">
                    {selectedId ? (
                        (() => {
                            const selectedPost = feedPosts.find((p: any) => p.id === selectedId);
                            if (!selectedPost) {
                                return (
                                    <div className="h-full flex items-center justify-center text-muted-foreground">
                                        Select an item to view details
                                    </div>
                                );
                            }
                            const postAny = selectedPost as any;

                            // Check for slug in various locations depending on data structure
                            const slug = postAny.meta?.slug || postAny.cover?.meta?.slug || postAny.pictures?.[0]?.meta?.slug;

                            if (postAny?.type === 'page-intern' && slug) {
                                return (
                                    <React.Suspense fallback={<div className="h-full flex items-center justify-center text-muted-foreground">Loading...</div>}>
                                        <UserPage
                                            userId={postAny.user_id}
                                            slug={slug}
                                            embedded
                                        />
                                    </React.Suspense>
                                );
                            }

                            if (postAny?.type === 'place-search' && postAny.meta?.url) {
                                return (
                                    <div className="h-full overflow-y-auto p-6 flex flex-col gap-4">
                                        <h2 className="text-xl font-semibold">{postAny.title}</h2>
                                        {postAny.description && (
                                            <p className="text-muted-foreground text-sm">{postAny.description}</p>
                                        )}
                                        <Link
                                            to={postAny.meta.url}
                                            className="text-primary font-medium hover:underline w-fit"
                                        >
                                            <T>Open place details</T>
                                        </Link>
                                    </div>
                                );
                            }

                            return (
                                <React.Suspense fallback={<div className="h-full flex items-center justify-center text-muted-foreground">Loading...</div>}>
                                    <Post
                                        key={selectedId}
                                        postId={selectedId}
                                        embedded
                                        className="h-full min-h-0 overflow-hidden flex flex-col"
                                    />
                                </React.Suspense>
                            );
                        })()
                    ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground">
                            Select an item to view details
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Mobile Layout
    return (
        <div className={`flex flex-col ${center ? 'max-w-3xl mx-auto' : ''}`}>
            {renderItems(true)}
            {hasMore && (
                <div className="p-4 text-center">
                    <Button variant="ghost" size="sm" onClick={() => loadMore()}>Load More</Button>
                </div>
            )}
        </div>
    );
};
