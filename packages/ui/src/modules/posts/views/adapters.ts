import {
    MediaItem,
    ImageMediaItem,
    VideoMediaItem,
    YouTubeMediaItem,
    TikTokMediaItem,
    PageMediaItem,
    MEDIA_TYPES,
} from '@/types';
import { detectMediaType } from '@/lib/mediaRegistry';

type SupabasePicture = any; // TODO: replace with actual type

/**
 * Adapter to convert Supabase picture row to MediaItem discriminated union
 */
export function adaptSupabasePictureToMediaItem(
    picture: SupabasePicture
): MediaItem {
    // Determine the media type
    const mediaType = picture.type || detectMediaType(picture.image_url, picture.meta);

    // Base fields common to all media types
    const base = {
        id: picture.id,
        user_id: picture.user_id,
        title: picture.title,
        description: picture.description,
        created_at: picture.created_at,
        updated_at: picture.updated_at,
        likes_count: picture.likes_count ?? 0,
        is_selected: picture.is_selected,
        visible: picture.visible,
        tags: picture.tags,
        flags: picture.flags,
        organization_id: picture.organization_id,
        parent_id: picture.parent_id,
        position: picture.position ?? 0,
    };

    // Create the appropriate discriminated union type based on mediaType
    switch (mediaType) {
        case MEDIA_TYPES.SUPABASE_IMAGE:
        case null:
            return {
                ...base,
                mediaType: 'supabase-image',
                image_url: picture.image_url,
                thumbnail_url: picture.thumbnail_url,
                responsive: (picture.meta as any)?.responsive,
                job: (picture.meta as any)?.job,
                meta: picture.meta,
            } as ImageMediaItem;

        case MEDIA_TYPES.MUX_VIDEO:
            return {
                ...base,
                mediaType: 'mux-video',
                video_url: picture.image_url,
                image_url: picture.image_url, // For backward compatibility
                thumbnail_url: picture.thumbnail_url ?? '',
                duration: (picture.meta as any)?.duration,
                meta: picture.meta as any,
            } as VideoMediaItem;

        case MEDIA_TYPES.VIDEO_INTERN:
        case MEDIA_TYPES.VIDEO_EXTERN:
            return {
                ...base,
                mediaType: mediaType,
                video_url: picture.image_url,
                image_url: picture.image_url, // For backward compatibility
                thumbnail_url: picture.thumbnail_url ?? '',
                duration: (picture.meta as any)?.duration,
                meta: picture.meta as any,
            } as VideoMediaItem;

        case MEDIA_TYPES.YOUTUBE:
            return {
                ...base,
                mediaType: 'youtube',
                videoId: extractYouTubeId(picture.image_url) ?? '',
                image_url: picture.image_url,
                thumbnail_url: picture.thumbnail_url ?? '',
                meta: { url: picture.image_url, ...(picture.meta as any) },
            } as YouTubeMediaItem;

        case MEDIA_TYPES.TIKTOK:
            return {
                ...base,
                mediaType: 'tiktok',
                videoId: extractTikTokId(picture.image_url) ?? '',
                image_url: picture.image_url,
                thumbnail_url: picture.thumbnail_url ?? '',
                meta: { url: picture.image_url, ...(picture.meta as any) },
            } as TikTokMediaItem;

        case MEDIA_TYPES.PAGE:
            return {
                ...base,
                mediaType: 'page-intern',
                image_url: picture.image_url,
                thumbnail_url: picture.thumbnail_url,
                slug: (picture.meta as any)?.slug,
                url: (picture.meta as any)?.url,
                meta: picture.meta as any,
            } as PageMediaItem;

        case MEDIA_TYPES.PAGE_EXTERNAL:
            return {
                ...base,
                mediaType: 'page-external',
                image_url: picture.image_url,
                thumbnail_url: picture.thumbnail_url,
                slug: (picture.meta as any)?.slug,
                url: (picture.meta as any)?.url,
                meta: picture.meta as any,
            } as PageMediaItem;

        default:
            // Fallback to image for unknown types
            return {
                ...base,
                mediaType: 'supabase-image',
                image_url: picture.image_url,
                thumbnail_url: picture.thumbnail_url,
                meta: picture.meta,
            } as ImageMediaItem;
    }
}

/**
 * Extract YouTube video ID from URL
 */
function extractYouTubeId(url: string): string | null {
    // Handle various YouTube URL formats
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/,
        /youtube\.com\/embed\/([^?&\s]+)/,
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }

    return null;
}

/**
 * Extract TikTok video ID from URL
 */
function extractTikTokId(url: string): string | null {
    // Handle TikTok URL formats
    const patterns = [
        /tiktok\.com\/@[\w.-]+\/video\/(\d+)/,
        /tiktok\.com\/v\/(\d+)/,
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }

    return null;
}

/**
 * Batch adapter for multiple pictures
 */
export function adaptSupabasePicturesToMediaItems(
    pictures: SupabasePicture[]
): MediaItem[] {
    return pictures.map(adaptSupabasePictureToMediaItem);
}
