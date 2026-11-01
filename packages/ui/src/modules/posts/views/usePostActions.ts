import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { toast } from "sonner";
import { MediaItem } from "@/types";
import { translate } from "@/i18n";
import { updateMediaPositions } from "./utils";
import { PostItem } from './types';
import { User } from "@polymech/shared";
import { deletePost, updatePostMeta } from '@/modules/posts/client-posts';
import { deletePictures, updatePicture } from '@/modules/posts/client-pictures';

interface UsePostActionsProps {
    post: PostItem | null;
    mediaItems: MediaItem[];
    setMediaItems: React.Dispatch<React.SetStateAction<MediaItem[]>>;
    mediaItem: MediaItem | null; // Current item
    user: User | null;
    fetchMedia: () => void;
}

export const usePostActions = ({
    post,
    mediaItems,
    setMediaItems,
    mediaItem,
    user,
    fetchMedia
}: UsePostActionsProps) => {
    const navigate = useNavigate();

    // Dialog States
    const [showDeletePostDialog, setShowDeletePostDialog] = useState(false);
    const [showDeletePictureDialog, setShowDeletePictureDialog] = useState(false);
    const [showYouTubeDialog, setShowYouTubeDialog] = useState(false);
    const [showTikTokDialog, setShowTikTokDialog] = useState(false);
    const [showGalleryPicker, setShowGalleryPicker] = useState(false);
    const [showAIWizard, setShowAIWizard] = useState(false);
    const [showCategoryManager, setShowCategoryManager] = useState(false);

    // --- Actions ---

    const handleDeletePost = async () => {
        if (!post) return;
        try {
            await deletePost(post.id);
            toast.success(translate('Post deleted'));
            navigate('/');
        } catch (error) {
            console.error('Error deleting post:', error);
            toast.error(translate('Failed to delete post'));
        } finally {
            setShowDeletePostDialog(false);
        }
    };

    const handleDeletePicture = async () => {
        if (!mediaItem) return;
        try {
            // Delete via API (handles DB + storage cleanup)
            await deletePictures([mediaItem.id]);

            toast.success(translate('Picture deleted'));

            if (mediaItems.length <= 1 && post) {
                navigate(`/`);
            } else {
                fetchMedia();
            }

        } catch (error) {
            console.error('Error deleting picture:', error);
            toast.error(translate('Failed to delete picture'));
        } finally {
            setShowDeletePictureDialog(false);
        }
    };

    const handleUnlinkImage = async (item: MediaItem) => {
        try {
            // Optimistic update
            const newItems = mediaItems.filter(i => i.id !== item.id);
            setMediaItems(newItems);

            await updatePicture(item.id, {
                post_id: null,
                position: -1
            } as any);

            toast.success(translate('Image removed from post'));
            // Re-index remaining items
            await updateMediaPositions(newItems, setMediaItems, setMediaItems);
        } catch (error) {
            console.error('Error unlinking image:', error);
            toast.error(translate('Failed to remove image'));
            fetchMedia(); // Revert on error
        }
    };
    const handleMetaUpdate = async (newMeta: any) => {
        if (!post) return;

        // Persist to database
        try {
            await updatePostMeta(post.id, newMeta);
            toast.success(translate('Categories updated'));
            fetchMedia();
        } catch (error) {
            console.error('Failed to update post meta:', error);
            toast.error(translate('Failed to update categories'));
        }
    };


    return {
        // States
        showDeletePostDialog, setShowDeletePostDialog,
        showDeletePictureDialog, setShowDeletePictureDialog,
        showYouTubeDialog, setShowYouTubeDialog,
        showTikTokDialog, setShowTikTokDialog,
        showGalleryPicker, setShowGalleryPicker,
        showAIWizard, setShowAIWizard,
        showCategoryManager, setShowCategoryManager,

        // Actions
        handleDeletePost,
        handleDeletePicture,
        handleUnlinkImage,
        handleMetaUpdate,
        // handleLike // Kept in Post.tsx for now due to state coupling
    };
};
