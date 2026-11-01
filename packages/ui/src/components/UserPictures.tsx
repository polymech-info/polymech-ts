
import { useState, useEffect } from "react";
import { fetchUserPictures as fetchUserPicturesAPI } from "@/modules/posts/client-pictures";
import { deletePicture } from "@/modules/posts/client-pictures";
import { deletePost } from "@/modules/posts/client-posts";
import { MediaItem } from "@/types";
import { FEED_API_ENDPOINT } from "@/constants";
import { normalizeMediaType, isVideoType, detectMediaType } from "@/lib/mediaRegistry";
import { T, translate } from "@/i18n";
import { Loader2, ImageOff, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DeleteDialog } from "@/modules/posts/views/components/DeleteDialogs";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface UserPicturesProps {
    userId: string;
    isOwner?: boolean;
}

interface PostGroup {
    postId: string;
    postTitle: string;
    pictures: MediaItem[];
}

const UserPictures = ({ userId, isOwner }: UserPicturesProps) => {
    const [loading, setLoading] = useState(true);
    const [postGroups, setPostGroups] = useState<PostGroup[]>([]);
    const [orphanedPictures, setOrphanedPictures] = useState<MediaItem[]>([]);

    // Deletion states
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{ type: 'post' | 'picture', id: string, title?: string } | null>(null);

    const navigate = useNavigate();

    useEffect(() => {
        fetchUserPictures();
    }, [userId]);

    const fetchUserPictures = async (showLoading = true) => {
        try {
            if (showLoading) setLoading(true);

            // 1. Fetch all pictures for the user via API
            const pictures = await fetchUserPicturesAPI(userId) as MediaItem[];

            // 2. Fetch all posts for the user via API to get titles
            const params = new URLSearchParams({
                source: 'user',
                sourceId: userId,
                limit: '500'
            });
            const res = await fetch(`${FEED_API_ENDPOINT}?${params}`);
            if (!res.ok) throw new Error(`Failed to fetch posts: ${res.statusText}`);
            const feedPosts: any[] = await res.json();

            const postsMap = new Map<string, string>();
            feedPosts.forEach(post => {
                postsMap.set(post.id, post.title);
            });

            // 3. Group pictures
            const groups = new Map<string, MediaItem[]>();
            const orphans: MediaItem[] = [];

            pictures.forEach(pic => {
                const picAny = pic as any;
                const postId = picAny.post_id;

                if (postId && postsMap.has(postId)) {
                    if (!groups.has(postId)) {
                        groups.set(postId, []);
                    }
                    groups.get(postId)?.push(pic);
                } else {
                    orphans.push(pic);
                }
            });

            // Convert groups map to array
            const groupedResult: PostGroup[] = [];
            groups.forEach((pics, postId) => {
                groupedResult.push({
                    postId,
                    postTitle: postsMap.get(postId) || translate('Untitled Post'),
                    pictures: pics
                });
            });

            setPostGroups(groupedResult);
            setOrphanedPictures(orphans);

        } catch (error) {
            console.error("Error fetching user pictures:", error);
            toast.error(translate("Failed to load pictures"));
        } finally {
            setLoading(false);
        }
    };

    const handleMediaClick = (pic: MediaItem) => {
        const picAny = pic as any;
        if (picAny.post_id) {
            navigate(`/post/${picAny.post_id}`);
        } else {
            navigate(`/post/${pic.id}`);
        }
    };

    const initiateDelete = (type: 'post' | 'picture', id: string, title?: string) => {
        setItemToDelete({ type, id, title });
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;

        try {
            if (itemToDelete.type === 'post') {
                await deletePost(itemToDelete.id);
                toast.success(translate("Post deleted successfully"));
            } else {
                // Delete picture via API (handles storage + db)
                await deletePicture(itemToDelete.id);
                toast.success(translate("Picture deleted successfully"));
            }

            fetchUserPictures(false);
            setDeleteDialogOpen(false);
            setItemToDelete(null);

        } catch (error) {
            console.error("Error deleting item:", error);
            toast.error(translate("Failed to delete item"));
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (postGroups.length === 0 && orphanedPictures.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
                <ImageOff className="h-12 w-12 mb-4 opacity-50" />
                <p><T>No pictures found</T></p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-12">
            <DeleteDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                onConfirm={handleConfirmDelete}
                title={itemToDelete?.type === 'post' ? translate("Delete Post") : translate("Delete Picture")}
                description={itemToDelete?.type === 'post'
                    ? translate("Are you sure you want to delete this post? All associated pictures may also be deleted or orphaned depending on settings.")
                    : translate("Are you sure you want to delete this picture?")
                }
            />

            {/* Orphaned Pictures Section */}
            {orphanedPictures.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                        <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                            {orphanedPictures.length}
                        </span>
                        <T>Unused / Orphaned Pictures</T>
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {orphanedPictures.map(pic => (
                            <SimpleMediaCard
                                key={pic.id}
                                item={pic}
                                onClick={() => handleMediaClick(pic)}
                                onDelete={isOwner ? () => initiateDelete('picture', pic.id, pic.title) : undefined}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Grouped by Post */}
            {postGroups.map(group => (
                <div key={group.postId} className="border rounded-xl p-6 bg-card/50">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-semibold truncate hover:underline cursor-pointer" onClick={() => navigate(`/post/${group.postId}`)}>
                            {group.postTitle}
                        </h3>
                        <div className="flex items-center gap-3">
                            <span className="text-muted-foreground text-sm">{group.pictures.length} <T>pictures</T></span>
                            {isOwner && (
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => initiateDelete('post', group.postId, group.postTitle)}
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    <T>Delete Post</T>
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {group.pictures.map(pic => (
                            <SimpleMediaCard
                                key={pic.id}
                                item={pic}
                                onClick={() => handleMediaClick(pic)}
                                onDelete={isOwner ? () => initiateDelete('picture', pic.id, pic.title) : undefined}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

interface SimpleMediaCardProps {
    item: MediaItem;
    onClick: () => void;
    onDelete?: () => void;
}

const SimpleMediaCard = ({ item, onClick, onDelete }: SimpleMediaCardProps) => {
    const effectiveType = item.type || detectMediaType(item.image_url);
    const isVideo = isVideoType(normalizeMediaType(effectiveType));

    return (
        <div className="group relative aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer border hover:border-primary/50 transition-all">
            <div onClick={onClick} className="w-full h-full">
                {/* Image/Video Content */}
                {isVideo ? (
                    <div className="w-full h-full flex items-center justify-center bg-black/10">
                        {item.thumbnail_url ? (
                            <img src={item.thumbnail_url} className="w-full h-full object-cover" alt={item.title} />
                        ) : (
                            <span className="text-xs">Video</span>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                <div className="w-0 h-0 border-t-4 border-t-transparent border-l-8 border-l-white border-b-4 border-b-transparent ml-1"></div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <img
                        src={item.thumbnail_url || item.image_url}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        loading="lazy"
                    />
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className="text-white text-xs truncate font-medium">{item.title}</p>
                    </div>
                </div>
            </div>

            {/* Delete Button - Top Right Overlay */}
            {onDelete && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <Button
                        variant="destructive"
                        size="icon"
                        className="h-8 w-8 rounded-full shadow-md"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            )}
        </div>
    );
};

export default UserPictures;
