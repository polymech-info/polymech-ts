import { ImageFile, MediaItem } from "@/types";
import { User } from "@polymech/shared";

// PostMediaItem extends MediaItem with post-specific fields
export type PostMediaItem = MediaItem & {
    post_id: string | null;
    renderKey?: string;
};

export interface PostItem {
    id: string;
    title: string;
    description: string | null;
    user_id: string;
    created_at: string;
    updated_at: string;
    pictures?: PostMediaItem[];
    settings?: PostSettings;
    meta?: PostMeta;
    isPseudo?: boolean; // For single pictures without posts
    type?: string; // Deprecated: use pictures[0].mediaType instead
}

// Structured settings instead of `any`
export interface PostSettings {
    display?: 'compact' | 'thumbs';
    link?: string; // For link posts
    image_url?: string;
    thumbnail_url?: string;
    [key: string]: any; // Allow extension
}

// Structured meta instead of `any`
export interface PostMeta {
    slug?: string; // For page-intern
    [key: string]: any; // Allow extension
}

export interface UserProfile {
    user_id: string;
    avatar_url: string | null;
    display_name: string | null;
    username: string | null;
}

export interface PostRendererProps {
    post: PostItem | null;
    authorProfile: any;
    mediaItems: PostMediaItem[];
    localMediaItems: PostMediaItem[]; // For edit mode
    mediaItem: PostMediaItem; // Current selected item

    // User Context
    user: User | null;
    isOwner: boolean;
    isEditMode: boolean;
    isLiked: boolean;
    likesCount: number;

    // State
    localPost: any;
    setLocalPost: React.Dispatch<React.SetStateAction<any>>;
    setLocalMediaItems: React.Dispatch<React.SetStateAction<PostMediaItem[]>>;

    // Handlers
    onEditModeToggle: () => void;
    onEditPost: () => void;
    onViewModeChange: (mode: 'compact' | 'thumbs') => void;
    onExportMarkdown: () => void;
    onSaveChanges: () => void;
    onDeletePost: () => void; // Opens dialog
    onDeletePicture: () => void; // Opens dialog

    // Media Actions
    onLike: () => void;
    onUnlinkImage: (item: PostMediaItem) => void;
    onRemoveFromPost: (index: number) => void;
    onEditPicture: () => void;
    onGalleryPickerOpen: (index: number) => void;
    onYouTubeAdd: () => void;
    onTikTokAdd: () => void;
    onAIWizardOpen: (index: number) => void;
    onInlineUpload: (files: File[], index: number) => Promise<void>;
    onMoveItem: (index: number, direction: 'up' | 'down') => void;
    onMediaSelect: (item: PostMediaItem) => void;
    onExpand: (item: PostMediaItem) => void;
    onDownload: () => void;
    onCategoryManagerOpen?: () => void;


    // Comparison helpers
    currentImageIndex: number;

    // Mux/Video helpers
    videoPlaybackUrl?: string; // Optional, computed in parent
    videoPosterUrl?: string;   // Optional, computed in parent

    // For compact view
    versionImages: ImageFile[];
    handlePrevImage: () => void;
    handleNavigate: (direction: 'prev' | 'next') => void;
    navigationData?: any;
    embedded?: boolean;
    className?: string;
}
