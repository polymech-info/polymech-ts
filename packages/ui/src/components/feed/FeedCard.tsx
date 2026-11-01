import React, { useState } from 'react';
import { FeedPost } from '@/modules/posts/client-posts';
import { FeedCarousel } from './FeedCarousel';
import { Heart, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useNavigate } from "react-router-dom";
import { normalizeMediaType } from "@/lib/mediaRegistry";
import { toggleLike } from '@/modules/posts/client-pictures';
import UserAvatarBlock from '@/components/UserAvatarBlock';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { formatDate } from '@/utils/textUtils';
import { T } from '@/i18n';

interface FeedCardProps {
    post: FeedPost;
    currentUserId?: string;
    onLike?: () => void;
    onComment?: () => void;
    onShare?: () => void;
    onNavigate?: (id: string) => void;
    showTitle?: boolean;
    showDescription?: boolean;
    showAuthor?: boolean;
    showSocial?: boolean;
}

export const FeedCard: React.FC<FeedCardProps> = ({
    post,
    currentUserId,
    onLike,
    onNavigate,
    showTitle = false,
    showDescription = false,
    showAuthor = true,
    showSocial = true,
}) => {
    const navigate = useNavigate();
    // Initialize from precomputed status (post.cover.is_liked or post.is_liked)
    // We prioritize cover.is_liked if available, matching the server logic
    const initialLiked = post.cover?.is_liked ?? post.is_liked ?? false;
    const [isLiked, setIsLiked] = useState<boolean>(initialLiked);
    const [likeCount, setLikeCount] = useState(post.likes_count || 0);
    const [lastTap, setLastTap] = useState<number>(0);
    const [showHeartAnimation, setShowHeartAnimation] = useState(false);

    const handleLike = async () => {
        if (!currentUserId || !post.cover?.id) return;

        // Optimistic update
        const newStatus = !isLiked;
        setIsLiked(newStatus);
        setLikeCount(prev => newStatus ? prev + 1 : prev - 1);

        try {
            await toggleLike(currentUserId, post.cover.id, isLiked);
            onLike?.();
        } catch (e) {
            // Revert
            setIsLiked(!newStatus);
            setLikeCount(prev => !newStatus ? prev + 1 : prev - 1);
            console.error(e);
        }
    };

    const handleDoubleTap = (e: React.SyntheticEvent) => {
        const now = Date.now();
        const DOUBLE_TAP_DELAY = 300;

        if (now - lastTap < DOUBLE_TAP_DELAY) {
            if (!isLiked) {
                handleLike();
            }
            setShowHeartAnimation(true);
            setTimeout(() => setShowHeartAnimation(false), 1000);
        }
        setLastTap(now);
    };

    // Prepare items for carousel
    const carouselItems = (post.pictures && post.pictures.length > 0
        ? post.pictures
        : [post.cover]).filter(item => !!item);

    const handleItemClick = (itemId: string) => {
        const item = carouselItems.find(i => i.id === itemId);
        if (item) {
            const type = normalizeMediaType(item.type);
            if (type === 'page-intern' && item.meta?.slug) {
                const username = post.author?.username;
                navigate(`/user/${username || item.user_id || post.user_id}/pages/${item.meta.slug}`);
                return;
            }
        }

        onNavigate?.(post.id);
    };

    if (carouselItems.length === 0) {
        if (post.type === 'page-vfs-file' || post.type === 'page-vfs-folder' || post.type === 'page-intern' || post.type === 'page-external' || post.type === 'place-search') {
            return (
                <article className="bg-background md:border md:mb-6 md:pb-0 overflow-hidden p-4">
                    <div onClick={() => {
                        if (post.meta?.url) navigate(post.meta.url);
                        else if (post.type === 'page-intern' && post.meta?.slug) navigate(`/user/${post.author?.username || post.user_id}/pages/${post.meta.slug}`);
                        else onNavigate?.(post.id);
                    }} className="cursor-pointer">
                        <h3 className="font-semibold text-lg">{post.title}</h3>
                        {post.description && <p className="text-muted-foreground text-sm mt-1">{post.description}</p>}
                    </div>
                </article>
            );
        }
        return null;
    }

    return (
        <article className="bg-background md:border md:mb-6 md:pb-0 overflow-hidden">
            {/* Header: Author Info */}
            {showAuthor && (
                <div className="px-3 py-2 flex items-center justify-between">
                    <UserAvatarBlock
                        userId={post.user_id}
                        avatarUrl={post.author?.avatar_url}
                        displayName={post.author?.display_name || post.author?.username}
                        showDate={false}
                    />
                    <div className="text-xs text-muted-foreground">
                        {post.created_at ? formatDate(post.created_at) : ''}
                    </div>
                </div>
            )}

            {/* Media Carousel */}
            <div className="relative" onTouchEnd={handleDoubleTap} onClick={handleDoubleTap}>
                <FeedCarousel
                    items={carouselItems}
                    aspectRatio={1}
                    className="w-full bg-muted"
                    author={post.author?.display_name || post.author?.username || 'User'}
                    authorId={post.user_id}
                    authorAvatarUrl={post.author?.avatar_url}
                    onItemClick={handleItemClick}
                    showContent={false} // Silence internal card UI
                    showAuthor={false}
                    showActions={false}
                    showTitle={false}
                    showDescription={false}
                />
            </div>

            {/* Actions Bar */}
            {showSocial && (
                <div className="flex items-center px-2 pt-2">
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={handleLike}
                        className={cn("hover:text-red-500", isLiked && "text-red-500")}
                    >
                        <Heart className="h-6 w-6" fill={isLiked ? "currentColor" : "none"} />
                    </Button>
                    {likeCount > 0 && (
                        <span className="text-sm font-medium mr-1">{likeCount}</span>
                    )}

                    <Button
                        size="icon"
                        variant="ghost"
                        className="text-foreground"
                        onClick={() => {
                            onNavigate?.(post.id);
                        }}
                    >
                        <MessageCircle className="h-6 w-6 -rotate-90" />
                    </Button>
                </div>
            )}

            {/* Caption: Title & Description */}
            <div className={cn('px-4 pb-3 space-y-1', !showSocial && 'pt-2')}>
                {showTitle && post.title && (
                    <div className="font-bold text-sm">{post.title}</div>
                )}
                {showDescription && post.description && (
                    <div className="text-sm text-foreground/90 line-clamp-3">
                        <MarkdownRenderer content={post.description} className="prose-sm dark:prose-invert" />
                    </div>
                )}
            </div>
        </article>
    );
};
