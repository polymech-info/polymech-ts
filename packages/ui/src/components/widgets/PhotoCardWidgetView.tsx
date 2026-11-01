import React, { useState, useEffect } from 'react';
import { fetchPostById } from '@/modules/posts/client-posts';
import PhotoCard from '@/components/PhotoCard';
import { T } from '@/i18n';
import { ImageIcon } from 'lucide-react';

export interface Picture {
    id: string;
    title: string;
    description: string | null;
    image_url: string;
    likes_count: number;
    created_at: string;
    user_id: string;
}

export interface UserProfile {
    display_name: string | null;
    username: string | null;
    avatar_url?: string | null;
}

export interface PhotoCardWidgetProps {
    isEditMode?: boolean;
    pictureId?: string | null;
    postId?: string | null;
    showHeader?: boolean;
    showFooter?: boolean;
    showAuthor?: boolean;
    showActions?: boolean;
    showTitle?: boolean;
    showDescription?: boolean;
    contentDisplay?: 'below' | 'overlay' | 'overlay-always';
    imageFit?: 'contain' | 'cover';
    widgetInstanceId?: string;
    onPropsChange?: (props: Record<string, any>) => void;
    className?: string;
}

export interface PhotoCardWidgetViewState {
    pictureId: string | null;
    setPictureId: (id: string | null) => void;
    picture: Picture | null;
    setPicture: (p: Picture | null) => void;
    userProfile: UserProfile | null;
    setUserProfile: (p: UserProfile | null) => void;
    commentsCount: number;
    setCommentsCount: (n: number) => void;
    isLiked: boolean;
    loading: boolean;
    postId: string | null;
    setPostId: (id: string | null) => void;
    postData: any;
    setPostData: (d: any) => void;
    fetchPostData: () => Promise<void>;
    fetchPictureDataFallback: () => Promise<void>;
}

/** Hook: shared data fetching for both view and edit modes */
export function usePhotoCardData(propPictureId: string | null, propPostId: string | null) {
    const [pictureId, setPictureId] = useState<string | null>(propPictureId);
    const [picture, setPicture] = useState<Picture | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [commentsCount, setCommentsCount] = useState(0);
    const [isLiked, setIsLiked] = useState(false);
    const [loading, setLoading] = useState(false);
    const [postId, setPostId] = useState<string | null>(propPostId);
    const [postData, setPostData] = useState<any>(null);

    useEffect(() => { setPictureId(propPictureId); }, [propPictureId]);
    useEffect(() => { setPostId(propPostId); }, [propPostId]);

    useEffect(() => {
        if (postId) {
            fetchPostData();
        } else if (pictureId) {
            fetchPictureDataFallback();
        }
    }, [postId, pictureId]);

    const fetchPostData = async () => {
        if (!postId) return;
        setLoading(true);
        try {
            const data = await fetchPostById(postId);
            if (!data) {
                setPostData(null);
                setPicture(null);
                return;
            }
            setPostData(data);

            const visiblePictures = [...(data.pictures || [])]
                .filter((p: any) => p.visible !== false)
                .sort((a: any, b: any) => (a.position ?? 999) - (b.position ?? 999));

            const selectedPictures = visiblePictures.filter((p: any) => p.is_selected);
            const firstPicture = selectedPictures[0] || visiblePictures[0];
            if (firstPicture) {
                setPicture({
                    id: firstPicture.id,
                    title: firstPicture.title || data.title,
                    description: firstPicture.description ?? data.description,
                    image_url: firstPicture.image_url || firstPicture.url,
                    likes_count: data.likes_count || 0,
                    created_at: firstPicture.created_at || data.created_at,
                    user_id: data.user_id,
                });
                setPictureId(firstPicture.id);
            } else {
                setPicture(null);
            }

            if (data.author) {
                setUserProfile({
                    display_name: data.author.display_name || null,
                    username: data.author.username || null,
                    avatar_url: data.author.avatar_url || null,
                });
            }

            setCommentsCount(data.comments_count || 0);
        } catch (error) {
            console.error('Error fetching post data:', error);
            setPostData(null);
            setPicture(null);
        } finally {
            setLoading(false);
        }
    };

    const fetchPictureDataFallback = async () => {
        if (!pictureId) return;

        const isUrl = pictureId.startsWith('http://') || pictureId.startsWith('https://');
        if (isUrl) {
            setPicture({
                id: pictureId,
                title: 'External Image',
                description: null,
                image_url: pictureId,
                likes_count: 0,
                created_at: new Date().toISOString(),
                user_id: 'external'
            });
            setUserProfile({ display_name: 'External Source', username: 'external', avatar_url: null });
            setCommentsCount(0);
            setLoading(false);
            return;
        }

        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(pictureId)) {
            console.error('Invalid picture ID format. Expected UUID, got:', pictureId);
            setPicture(null);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const { fetchPictureById } = await import('@/modules/posts/client-pictures');
            const pictureData = await fetchPictureById(pictureId);
            setPicture(pictureData);
            if (pictureData?.profile) setUserProfile(pictureData.profile);
            setCommentsCount(pictureData?.comments_count || 0);
        } catch (error) {
            console.error('Error fetching picture data:', error);
        } finally {
            setLoading(false);
        }
    };

    return {
        pictureId, setPictureId,
        picture, setPicture,
        userProfile, setUserProfile,
        commentsCount, setCommentsCount,
        isLiked,
        loading,
        postId, setPostId,
        postData, setPostData,
        fetchPostData,
        fetchPictureDataFallback
    };
}

/** Lightweight view-only component — no edit deps, eagerly loaded */
const PhotoCardWidgetView: React.FC<PhotoCardWidgetProps> = (props) => {
    const {
        isEditMode = false,
        pictureId: propPictureId = null,
        postId: propPostId = null,
        showHeader = true,
        showFooter = true,
        showAuthor = true,
        showActions = true,
        showTitle = true,
        showDescription = true,
        contentDisplay = 'below',
        imageFit = 'cover',
        className,
    } = props;

    const state = usePhotoCardData(propPictureId, propPostId);
    const { pictureId, picture, userProfile, commentsCount, isLiked, loading, postId, postData, fetchPostData, fetchPictureDataFallback } = state;

    const handleLike = async () => {
        if (postId) { await fetchPostData(); } else { await fetchPictureDataFallback(); }
    };

    if (loading) {
        return (
            <div className="bg-card border rounded-lg p-8 text-center min-h-[300px] flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-sm text-muted-foreground"><T>Loading picture...</T></p>
            </div>
        );
    }

    if (!pictureId || !picture) {
        return (
            <div className="bg-card border rounded-lg p-8 text-center min-h-[300px] flex flex-col items-center justify-center relative">
                <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground mb-3"><T>Empty Photo Card</T></p>
            </div>
        );
    }

    const authorName = userProfile?.display_name || userProfile?.username || `User ${picture.user_id.slice(0, 8)}`;
    const isExternal = picture.user_id === 'external';
    const displayTitle = postData?.title ?? picture.title;
    const displayDescription = postData?.description ?? picture.description;

    return (
        <div className="w-full relative">
            <PhotoCard
                pictureId={picture.id}
                image={picture.image_url}
                title={displayTitle}
                author={authorName}
                authorId={picture.user_id}
                likes={picture.likes_count}
                comments={commentsCount}
                isLiked={isLiked}
                description={displayDescription}
                onClick={() => {
                    if (isExternal) {
                        window.open(picture.image_url, '_blank');
                    } else {
                        window.location.href = `/post/${postData?.id || pictureId}`;
                    }
                }}
                onLike={handleLike}
                variant={contentDisplay === 'overlay' || contentDisplay === 'overlay-always' ? 'grid' : 'feed'}
                overlayMode={contentDisplay === 'overlay-always' ? 'always' : 'hover'}
                showHeader={showHeader}
                showContent={showFooter}
                showAuthor={showAuthor}
                showActions={showActions}
                showTitle={showTitle}
                showDescription={showDescription}
                isExternal={isExternal}
                imageFit={imageFit}
                className={className}
            />
        </div>
    );
};

export default PhotoCardWidgetView;
