import MediaCard from "./MediaCard";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

import { useOrganization } from "@/contexts/OrganizationContext";
import { useFeedData } from "@/hooks/useFeedData";
import { normalizeMediaType, isVideoType } from "@/lib/mediaRegistry";
import type { MediaItem } from "@/types";
import { fetchUserMediaLikes } from "@/modules/posts/client-pictures";
import { T } from '@/i18n';

import type { FeedSortOption } from '@/hooks/useFeedData';
import { mapFeedPostsToMediaItems } from "@/modules/posts/client-posts";

interface GalleryLargeProps {
    customPictures?: any[];
    customLoading?: boolean;
    navigationSource?: 'home' | 'collection' | 'tag' | 'user' | 'search';
    navigationSourceId?: string;
    sortBy?: FeedSortOption;
    categorySlugs?: string[];
    categoryIds?: string[];
    contentType?: 'posts' | 'pages' | 'pictures' | 'files' | 'places';
    visibilityFilter?: 'invisible' | 'private';
    center?: boolean;
    preset?: any;
}

const GalleryLarge = ({
    customPictures,
    customLoading,
    navigationSource = 'home',
    navigationSourceId,
    sortBy = 'latest',
    categorySlugs,
    categoryIds,
    contentType,
    visibilityFilter,
    center,
    preset
}: GalleryLargeProps) => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const { orgSlug, isOrgContext } = useOrganization();
    const [mediaItems, setMediaItems] = useState<any[]>([]);
    const [userLikes, setUserLikes] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);

    // 1. Data Fetching
    const { posts: feedPosts, loading: feedLoading } = useFeedData({
        source: navigationSource,
        sourceId: navigationSourceId,
        isOrgContext,
        orgSlug,
        sortBy,
        categorySlugs,
        categoryIds,
        contentType,
        visibilityFilter,
        // Disable hook if we have custom pictures
        enabled: !customPictures
    });

    // 2. State & Effects
    useEffect(() => {
        let finalMedia: any[] = [];

        if (customPictures) {
            finalMedia = customPictures;
            setLoading(customLoading || false);
        } else {
            // Map FeedPost[] -> MediaItemType[]
            finalMedia = mapFeedPostsToMediaItems(feedPosts as any, sortBy);
            setLoading(feedLoading);
        }

        setMediaItems(finalMedia || []);
    }, [feedPosts, feedLoading, customPictures, customLoading, sortBy]);

    const refreshUserLikes = useCallback(async () => {
        if (!user || mediaItems.length === 0) return;
        try {
            const { pictureLikes } = await fetchUserMediaLikes(user.id);
            setUserLikes(pictureLikes);
        } catch (error) {
            console.error('Error fetching user likes:', error);
        }
    }, [user, mediaItems.length]);

    // Fetch likes on mount and whenever the media list changes
    useEffect(() => {
        refreshUserLikes();
    }, [refreshUserLikes]);

    const handleError = () => {
        window.location.reload();
    }

    if (loading) {
        return (
            <div className="py-8">
                <div className="text-center text-muted-foreground">
                    <T>Loading gallery...</T>
                </div>
            </div>
        );
    }

    if (!mediaItems || mediaItems.length === 0) {
        return (
            <div className="py-8">
                <div className="text-center text-muted-foreground">
                    <p className="text-lg"><T>No media yet!</T></p>
                    <p><T>Be the first to share content with the community.</T></p>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full relative max-w-4xl mx-auto px-4 pb-20 pt-4">
            <div className="flex flex-col gap-12">
                {mediaItems.map((item, index) => {
                    const itemType = normalizeMediaType(item.type);
                    const displayUrl = item.image_url; return (
                        <MediaCard
                            key={item.id}
                            id={item.id}
                            pictureId={item.picture_id}
                            url={displayUrl}
                            thumbnailUrl={item.thumbnail_url}
                            title={item.title}
                            author={undefined as any}
                            authorAvatarUrl={undefined}
                            authorId={item.user_id}
                            likes={item.likes_count || 0}
                            comments={item.comments[0]?.count || 0}
                            isLiked={userLikes.has(item.picture_id || item.id)}
                            description={item.description}
                            type={itemType}
                            meta={item.meta}
                            onClick={() => navigate(`/post/${item.id}`)}
                            onLike={refreshUserLikes}
                            onDelete={handleError}
                            created_at={item.created_at}
                            job={item.job}
                            responsive={item.responsive}
                            variant="feed"
                            preset={preset}
                        />
                    );
                })}
            </div>
        </div>
    );
};

export default GalleryLarge;
