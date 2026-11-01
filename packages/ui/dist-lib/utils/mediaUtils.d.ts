export interface MediaItem {
    id: string;
    type: 'picture' | 'video' | 'page-external';
    title: string;
    description: string | null;
    url: string;
    thumbnail_url: string | null;
    likes_count: number;
    created_at: string;
    user_id: string;
    comments_count: number;
    meta?: any;
}
interface FetchMediaOptions {
    organizationId?: string | null;
    includePrivate?: boolean;
    limit?: number;
    userId?: string;
    tag?: string;
}
/**
 * Fetches and merges pictures and videos from the database
 * Returns a unified array of media items sorted by created_at
 */
export declare function fetchMediaItems(options?: FetchMediaOptions): Promise<MediaItem[]>;
/**
 * Fetches user likes for all media (both pictures and videos)
 * Note: Videos are also stored in the pictures table with type='mux-video'
 */
export declare function fetchUserMediaLikes(userId: string): Promise<{
    pictureLikes: Set<string>;
    videoLikes: Set<string>;
}>;
/**
 * Checks if a given URL is a TikTok URL
 */
export declare function isTikTokUrl(url: string | null | undefined): boolean;
/**
 * Extracts YouTube Video ID from various URL formats
 */
export declare function getYouTubeVideoId(url: string | null | undefined): string | null;
/**
 * Extracts TikTok Video ID
 */
export declare function getTikTokVideoId(url: string | null | undefined): string | null;
export {};
