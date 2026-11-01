import { PostMediaItem } from "../../types";

export interface GalleryProps {
    /** Array of media items to display */
    mediaItems: PostMediaItem[];

    /** Currently selected media item */
    selectedItem: PostMediaItem;

    /** Callback when a media item is selected */
    onMediaSelect: (item: PostMediaItem) => void;

    /** Callback when media is expanded/fullscreen */
    onExpand: (item: PostMediaItem) => void;

    /** Whether the current user owns this content */
    isOwner: boolean;

    /** Edit mode state */
    isEditMode?: boolean;

    /** Local media items for edit mode */
    localMediaItems?: PostMediaItem[];

    /** Setter for local media items */
    setLocalMediaItems?: (items: PostMediaItem[]) => void;

    /** Callback to delete current picture */
    onDeletePicture?: () => void;

    /** Callback to edit a picture (navigate to PostPage) */
    onEditPicture?: (item: PostMediaItem) => void;

    /** Callback to open gallery picker at specific index */
    onGalleryPickerOpen?: (index: number) => void;

    /** Cache bust keys for images */
    cacheBustKeys?: Record<string, number>;

    /** Navigation data for cross-post navigation */
    navigationData?: any;

    /** Handler for navigating between posts */
    handleNavigate?: (direction: 'next' | 'prev') => void;

    /** React Router navigate function */
    navigate?: (path: any) => void;

    /** Video playback URL (for Mux videos) */
    videoPlaybackUrl?: string;

    /** Video poster/thumbnail URL */
    videoPosterUrl?: string;

    /** Whether to show desktop layout */
    showDesktopLayout?: boolean;

    /** Thumbnail layout mode: 'strip' (horizontal scroll) or 'grid' (multiple rows) */
    thumbnailLayout?: 'strip' | 'grid';

    /** Image fit mode: 'contain' (fit within bounds) or 'cover' (fill bounds) */
    imageFit?: 'contain' | 'cover';

    /** Custom className for container */
    className?: string;

    /** Position of the thumbnails relative to the main image */
    thumbnailsPosition?: 'bottom' | 'top' | 'left' | 'right';

    /** Orientation of the thumbnail strip */
    thumbnailsOrientation?: 'horizontal' | 'vertical';

    /** Whether to enable zoom (spyglass) on main image */
    zoomEnabled?: boolean;

    /** Show the picture title beside/below the main image */
    showTitle?: boolean;

    /** Show the picture description beside/below the main image */
    showDescription?: boolean;

    /** Additional CSS classes for thumbnails strip */
    thumbnailsClassName?: string;

    /** Auto-play videos when selected */
    autoPlayVideos?: boolean;
}
