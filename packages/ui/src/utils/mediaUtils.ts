export interface MediaItem {
  id: string;
  type: 'picture' | 'video' | 'page-external';
  title: string;
  description: string | null;
  url: string; // image_url or video_url
  thumbnail_url: string | null;
  likes_count: number;
  created_at: string;
  user_id: string;
  comments_count: number;
  meta?: any;
}

export interface FetchMediaOptions {
  organizationId?: string | null;
  includePrivate?: boolean;
  limit?: number;
  userId?: string; // Filter by specific user
  tag?: string; // Filter by tag
}

/**
 * Checks if a given URL is a TikTok URL
 */
export function isTikTokUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.includes('tiktok.com');
}

/**
 * Extracts YouTube Video ID from various URL formats
 */
export function getYouTubeVideoId(url: string | null | undefined): string | null {
  if (!url) return null;

  // Regular expressions for different YouTube URL formats
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);

  return (match && match[2].length === 11) ? match[2] : null;
}

/**
 * Extracts TikTok Video ID
 */
export function getTikTokVideoId(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname.includes('tiktok.com') && urlObj.pathname.includes('/video/')) {
      const parts = urlObj.pathname.split('/video/');
      if (parts.length > 1) {
        return parts[1].split(/[?#]/)[0];
      }
    }
  } catch {
    return null;
  }
  return null;
}
