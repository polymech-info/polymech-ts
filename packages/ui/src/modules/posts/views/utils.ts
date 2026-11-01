import { MediaItem, MuxResolution } from "@/types";

export const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

export const getTikTokId = (url: string) => {
    try {
        const urlObj = new URL(url);
        // Standard https://www.tiktok.com/@user/video/VIDEO_ID
        if (urlObj.hostname.includes('tiktok.com') && urlObj.pathname.includes('/video/')) {
            const parts = urlObj.pathname.split('/video/');
            if (parts.length > 1) {
                return parts[1].split(/[?#]/)[0]; // Remove query params or hash
            }
        }
    } catch {
        return null;
    }
    return null;
};

export const updateMediaPositions = <T extends { position?: number }>(items: T[], setLocalMediaItems: (items: any[]) => void, setMediaItems: (items: any[]) => void) => {
    const reordered = items.map((item, idx) => ({ ...item, position: idx }));
    setLocalMediaItems(reordered);
    setMediaItems(reordered);
};

// Add max_resolution query parameter to video URL for bandwidth optimization
// Use 720p for detail page (higher quality than grid view)
// See: https://www.mux.com/docs/guides/control-playback-resolution
export const getVideoUrlWithResolution = (url: string, maxResolution: MuxResolution = '720p') => {
    // Skip for internal videos
    if (url.includes('/api/videos/')) return url;

    try {
        const urlObj = new URL(url);
        urlObj.searchParams.set('max_resolution', maxResolution);
        return urlObj.toString();
    } catch {
        // If URL parsing fails, append as query string
        const separator = url.includes('?') ? '&' : '?';
        return `${url}${separator}max_resolution=${maxResolution}`;
    }
};
