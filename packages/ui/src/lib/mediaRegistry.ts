/**
 * Media Type Registry
 * 
 * Unified system for handling different media types in the 'pictures' table
 * based on the 'type' column.
 * 
 * This file contains utility functions and the renderer registry.
 * Type definitions are in @/types.ts
 */

import React from 'react';
import {
  MEDIA_TYPES,
  MediaType,
  MediaItem,
  ImageMediaItem,
  VideoMediaItem,
  YouTubeMediaItem,
  TikTokMediaItem,
  PageMediaItem,
} from '@/types';

// Re-export for convenience
export {
  MEDIA_TYPES,
  type MediaType,
  type MediaItem,
  type ImageMediaItem,
  type VideoMediaItem,
  type YouTubeMediaItem,
  type TikTokMediaItem,
  type PageMediaItem,
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// Normalize type - treat NULL as SUPABASE_IMAGE (backward compatibility)
export function normalizeMediaType(type: string | null | undefined): MediaType {
  if (!type || type === MEDIA_TYPES.SUPABASE_IMAGE) {
    return MEDIA_TYPES.SUPABASE_IMAGE;
  }
  return type as MediaType;
}

// Check if a media type is a video
export function isVideoType(type: MediaType): boolean {
  return type === MEDIA_TYPES.MUX_VIDEO || type === MEDIA_TYPES.YOUTUBE || type === MEDIA_TYPES.TIKTOK || type === MEDIA_TYPES.VIDEO_INTERN || type === MEDIA_TYPES.VIDEO_EXTERN;
}

// Check if a media type is an image
export function isImageType(type: MediaType): boolean {
  return !type || type === MEDIA_TYPES.SUPABASE_IMAGE;
}

// Get URL field name based on type
export function getMediaUrlField(type: MediaType): 'image_url' | 'image_url' {
  // For now, both use image_url (videos store their m3u8 URL there)
  return 'image_url';
}

// Get thumbnail field
export function getThumbnailField(type: MediaType): 'thumbnail_url' | null {
  return 'thumbnail_url';
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isImageMediaItem(item: MediaItem): item is ImageMediaItem {
  return item.mediaType === 'supabase-image';
}

export function isVideoMediaItem(item: MediaItem): item is VideoMediaItem {
  return item.mediaType === 'mux-video' || item.mediaType === 'video-intern' || item.mediaType === 'video-extern';
}

export function isYouTubeMediaItem(item: MediaItem): item is YouTubeMediaItem {
  return item.mediaType === 'youtube';
}

export function isTikTokMediaItem(item: MediaItem): item is TikTokMediaItem {
  return item.mediaType === 'tiktok';
}

export function isPageMediaItem(item: MediaItem): item is PageMediaItem {
  return item.mediaType === 'page-intern' || item.mediaType === 'page-external' || item.mediaType === 'page-vfs-file' || item.mediaType === 'page-vfs-folder';
}

export function isExternalVideoItem(item: MediaItem): item is YouTubeMediaItem | TikTokMediaItem {
  return isYouTubeMediaItem(item) || isTikTokMediaItem(item);
}

export function isAnyVideoItem(item: MediaItem): item is VideoMediaItem | YouTubeMediaItem | TikTokMediaItem {
  return isVideoMediaItem(item) || isExternalVideoItem(item);
}

// ============================================================================
// MEDIA RENDERER REGISTRY (LEGACY - for backward compatibility)
// ============================================================================

// Media renderer registry
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

// Registry interface
interface MediaTypeConfig {
  name: string;
  component: React.ComponentType<MediaRendererProps>;
  uploadComponent?: React.ComponentType<any>;
}

// The registry will be populated by importing the components
const registry = new Map<MediaType, MediaTypeConfig>();

// Register a media type
export function registerMediaType(
  type: MediaType,
  config: MediaTypeConfig
): void {
  registry.set(type, config);
}

// Get renderer for a media type
export function getMediaRenderer(type: MediaType): React.ComponentType<MediaRendererProps> | null {
  const normalized = normalizeMediaType(type);
  const config = registry.get(normalized);
  return config?.component || null;
}

// Get media type config
export function getMediaTypeConfig(type: MediaType): MediaTypeConfig | null {
  const normalized = normalizeMediaType(type);
  return registry.get(normalized) || null;
}

// Helper to determine media type from URL or other properties
export function detectMediaType(url: string, meta?: any): MediaType {
  // Check for Internal Video
  if (url.includes('/api/videos/')) {
    return MEDIA_TYPES.VIDEO_INTERN;
  }

  // Check for video extensions in URL (useful for VFS paths like /api/vfs/get/...)
  try {
    const urlObj = new URL(url, 'http://localhost'); // Provide dummy base for relative URLs
    const pathname = urlObj.pathname.toLowerCase();
    if (pathname.match(/\.(mp4|webm|ogg|mov|mkv)$/)) {
      return MEDIA_TYPES.VIDEO_EXTERN;
    }
  } catch (e) {
    // Fallback if URL parsing fails
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('.mp4') || lowerUrl.includes('.webm') || lowerUrl.includes('.mov')) {
      return MEDIA_TYPES.VIDEO_EXTERN;
    }
  }

  // Check if it's a Mux video (HLS stream)
  if (url.includes('stream.mux.com') || url.includes('.m3u8')) {
    return MEDIA_TYPES.MUX_VIDEO;
  }

  // Check if it's a YouTube video
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return MEDIA_TYPES.YOUTUBE;
  }

  // Check if it's a TikTok video
  if (url.includes('tiktok.com')) {
    return MEDIA_TYPES.TIKTOK;
  }

  // Check meta for Mux identifiers
  if (meta && (meta.mux_asset_id || meta.mux_playback_id)) {
    return MEDIA_TYPES.MUX_VIDEO;
  }

  // Default to image
  return MEDIA_TYPES.SUPABASE_IMAGE;
}

export default {
  MEDIA_TYPES,
  normalizeMediaType,
  isVideoType,
  isImageType,
  getMediaUrlField,
  getThumbnailField,
  registerMediaType,
  getMediaRenderer,
  getMediaTypeConfig,
  detectMediaType,
};
