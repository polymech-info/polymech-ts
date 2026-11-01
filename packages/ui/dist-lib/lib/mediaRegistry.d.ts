import { default as React } from 'react';
export declare const MEDIA_TYPES: {
    readonly SUPABASE_IMAGE: "supabase-image";
    readonly MUX_VIDEO: "mux-video";
    readonly VIDEO_INTERN: "video-intern";
    readonly YOUTUBE: "youtube";
    readonly TIKTOK: "tiktok";
    readonly PAGE: "page-intern";
    readonly PAGE_EXTERNAL: "page-external";
};
export type MediaType = typeof MEDIA_TYPES[keyof typeof MEDIA_TYPES] | null;
export declare function normalizeMediaType(type: string | null | undefined): MediaType;
export declare function isVideoType(type: MediaType): boolean;
export declare function isImageType(type: MediaType): boolean;
export declare function getMediaUrlField(type: MediaType): 'image_url' | 'image_url';
export declare function getThumbnailField(type: MediaType): 'thumbnail_url' | null;
export interface MediaRendererProps {
    id: string;
    url: string;
    thumbnailUrl?: string | null;
    title: string;
    author: string;
    authorId: string;
    likes: number;
    comments: number;
    isLiked?: boolean;
    description?: string | null;
    type: MediaType;
    meta?: any;
    onClick?: (id: string) => void;
    onLike?: () => void;
    onDelete?: () => void;
}
interface MediaTypeConfig {
    name: string;
    component: React.ComponentType<MediaRendererProps>;
    uploadComponent?: React.ComponentType<any>;
}
export declare function registerMediaType(type: MediaType, config: MediaTypeConfig): void;
export declare function getMediaRenderer(type: MediaType): React.ComponentType<MediaRendererProps> | null;
export declare function getMediaTypeConfig(type: MediaType): MediaTypeConfig | null;
export declare function detectMediaType(url: string, meta?: any): MediaType;
declare const _default: {
    MEDIA_TYPES: {
        readonly SUPABASE_IMAGE: "supabase-image";
        readonly MUX_VIDEO: "mux-video";
        readonly VIDEO_INTERN: "video-intern";
        readonly YOUTUBE: "youtube";
        readonly TIKTOK: "tiktok";
        readonly PAGE: "page-intern";
        readonly PAGE_EXTERNAL: "page-external";
    };
    normalizeMediaType: typeof normalizeMediaType;
    isVideoType: typeof isVideoType;
    isImageType: typeof isImageType;
    getMediaUrlField: typeof getMediaUrlField;
    getThumbnailField: typeof getThumbnailField;
    registerMediaType: typeof registerMediaType;
    getMediaRenderer: typeof getMediaRenderer;
    getMediaTypeConfig: typeof getMediaTypeConfig;
    detectMediaType: typeof detectMediaType;
};
export default _default;
