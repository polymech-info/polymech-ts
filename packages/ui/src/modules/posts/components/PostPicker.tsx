import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { MediaType } from '@/types';
import MediaCard from '@/components/MediaCard';
import { Loader2 } from 'lucide-react';
import { T } from '@/i18n';
import { FEED_API_ENDPOINT } from '@/constants';

interface PostPickerProps {
    onSelect: (postId: string) => void;
}

const PostPicker: React.FC<PostPickerProps> = ({ onSelect }) => {
    const { user } = useAuth();
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        fetchPosts();
    }, [user]);

    const fetchPosts = async () => {
        try {
            setLoading(true);

            const params = new URLSearchParams({
                source: 'user',
                sourceId: user!.id,
                limit: '100'
            });

            const res = await fetch(`${FEED_API_ENDPOINT}?${params}`);
            if (!res.ok) throw new Error(`Failed to fetch posts: ${res.statusText}`);

            const feedPosts: any[] = await res.json();

            // Transform FeedPost[] for display
            const transformed = feedPosts.map(post => {
                const cover = post.cover;
                if (!cover) return null;

                return {
                    id: post.id,
                    pictureId: cover.id,
                    title: post.title,
                    created_at: post.created_at,
                    url: cover.image_url,
                    thumbnailUrl: cover.thumbnail_url,
                    type: cover.type as MediaType,
                    meta: cover.meta,
                    likes: post.likes_count || 0,
                    comments: post.comments_count || 0,
                    author: user?.email || 'Me',
                    authorId: user?.id || '',
                };
            }).filter(Boolean);

            setPosts(transformed);
        } catch (err) {
            console.error("Error fetching posts:", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-40">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
        );
    }

    if (posts.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                <T>No posts found.</T>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto p-4">
            {posts.map((post: any) => (
                <div
                    key={post.id}
                    className="cursor-pointer group flex flex-col gap-2"
                    onClick={() => onSelect(post.id)}
                >
                    <div className="border-2 border-transparent group-hover:border-primary rounded-lg overflow-hidden transition-all relative aspect-square">
                        <MediaCard
                            id={post.id}
                            pictureId={post.pictureId}
                            url={post.url}
                            thumbnailUrl={post.thumbnailUrl}
                            title={post.title}
                            author={post.author}
                            authorId={post.authorId}
                            likes={0}
                            comments={0}
                            type={post.type}
                            meta={post.meta}
                            showContent={false}
                            // Disable default interactions
                            onClick={() => onSelect(post.id)}
                            onLike={undefined}
                            onDelete={undefined}
                            onEdit={undefined}
                        />
                    </div>
                    <div className="px-1">
                        <h4 className="font-medium text-sm truncate">{post.title || <T>Untitled</T>}</h4>
                        <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                            <span>{new Date(post.created_at || Date.now()).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default PostPicker;
