export interface ImageFile {
  path: string;
  src: string;
  selected?: boolean;
  isGenerated?: boolean;
  title?: string;
  description?: string;
}

// ============================================================================
// SHARED TYPES
// ============================================================================

export interface Comment {
  id: string;
  content: string;
  user_id: string;
  parent_comment_id: string | null;
  created_at: string;
  updated_at: string;
  likes_count: number;
  replies?: Comment[];
  depth?: number;
}

// ============================================================================
// MEDIA TYPES - Single source of truth
// ============================================================================

export const MEDIA_TYPES = {
  SUPABASE_IMAGE: 'supabase-image',
  MUX_VIDEO: 'mux-video',
  VIDEO_INTERN: 'video-intern',
  VIDEO_EXTERN: 'video-extern',
  YOUTUBE: 'youtube',
  TIKTOK: 'tiktok',
  PAGE: 'page-intern',
  PAGE_EXTERNAL: 'page-external',
  PAGE_VFS_FILE: 'page-vfs-file',
  PAGE_VFS_FOLDER: 'page-vfs-folder',
  PLACE_SEARCH: 'place-search',
} as const;

export type MediaType = typeof MEDIA_TYPES[keyof typeof MEDIA_TYPES] | null;

// ============================================================================
// DISCRIMINATED UNION TYPES FOR MEDIA ITEMS
// ============================================================================

// Base interface for common fields across all media types
interface BaseMediaItem {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  type?: string;
  mediaType?: string;
  created_at: string;
  updated_at: string;
  likes_count: number;
  is_liked?: boolean;
  is_selected: boolean;
  visible: boolean;
  tags: string[] | null;
  flags: string[] | null;
  organization_id: string | null;
  parent_id: string | null; // For versions/variants
  position: number;
  picture_id?: string; // For feed items that reference a picture
  comments?: Comment[]; // Server-enriched comments
  comments_count?: number;
  author?: {
    username: string;
    display_name: string;
    avatar_url: string;
  };
}

// Responsive image data structure
export interface ResponsiveImageData {
  sources?: Array<{
    srcset: string;
    type: string;
    sizes?: string;
  }>;
  fallback?: string;
}

// Internal video metadata
export interface VideoInternMetadata {
  duration?: number;
  width?: number;
  height?: number;
  format?: string;
  size?: number;
}

// Image media item
export interface ImageMediaItem extends BaseMediaItem {
  mediaType: 'supabase-image';
  image_url: string;
  thumbnail_url: string | null;
  responsive?: ResponsiveImageData;
  job?: any; // Image processing job metadata
  meta?: any; // Additional metadata
}

// Video media item (Mux or internal)
export interface VideoMediaItem extends BaseMediaItem {
  mediaType: 'mux-video' | 'video-intern' | 'video-extern';
  video_url: string;
  image_url: string; // For backward compatibility
  thumbnail_url: string;
  duration?: number;
  meta: MuxVideoMetadata | VideoInternMetadata | null;
}

// YouTube media item
export interface YouTubeMediaItem extends BaseMediaItem {
  mediaType: 'youtube';
  videoId: string;
  image_url: string; // Embed URL
  thumbnail_url: string;
  meta: { url: string;[key: string]: any };
}

// TikTok media item
export interface TikTokMediaItem extends BaseMediaItem {
  mediaType: 'tiktok';
  videoId: string;
  image_url: string; // Embed URL
  thumbnail_url: string;
  meta: { url: string;[key: string]: any };
}

// Page media item (internal, external, or vfs)
export interface PageMediaItem extends BaseMediaItem {
  mediaType: 'page-intern' | 'page-external' | 'page-vfs-file' | 'page-vfs-folder';
  slug?: string; // For internal pages
  url?: string; // For external/vfs pages
  image_url: string; // Preview/thumbnail image
  thumbnail_url?: string;
  meta: { url?: string; slug?: string;[key: string]: any };
}

// Discriminated union of all media item types
export type MediaItem =
  | ImageMediaItem
  | VideoMediaItem
  | YouTubeMediaItem
  | TikTokMediaItem
  | PageMediaItem;

// Legacy MediaItem interface - kept for backward compatibility during migration
// TODO: Remove after all components are updated to use discriminated unions
export interface LegacyMediaItem {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  image_url: string; // For images: image URL, for videos: HLS stream URL
  thumbnail_url: string | null;
  type: import('./lib/mediaRegistry').MediaType; // NULL or 'supabase-image' for images, 'mux-video' for videos
  meta: any | null; // Video metadata for mux-video, null for images
  created_at: string;
  updated_at: string;
  likes_count: number | null;
  is_liked?: boolean;
  is_selected: boolean;
  visible: boolean;
  tags: string[] | null;
  flags: string[] | null;
  organization_id: string | null;
  parent_id: string | null;
  position: number;
  job?: any;
  picture_id?: string;
  responsive?: any; // To hold server-generated responsive data
  author?: {
    username: string;
    display_name: string;
    avatar_url: string;
  };
}

// Mux Video Resolution Types
// See: https://www.mux.com/docs/guides/control-playback-resolution
export type MuxResolution = '270p' | '360p' | '480p' | '540p' | '720p' | '1080p' | '1440p' | '2160p';

export interface GeneratedImage {
  src: string;
  filename: string;
}

export interface PromptTemplate {
  name: string;
  text: string;
}

// Mux Video Types

export interface MuxTrack {
  type: 'video' | 'audio' | 'text';
  duration?: number;
  encoding?: string;
  width?: number;
  height?: number;
  frame_rate?: number;
  sample_rate?: number;
  channels?: number;
}

export interface MuxVideoMetadata {
  mux_upload_id: string;
  mux_asset_id: string;
  mux_playback_id: string;
  duration: number | null;
  aspect_ratio: string | null;
  created_at: string;
  status: 'preparing' | 'ready' | 'errored';
  max_stored_resolution: string | null;
  max_stored_frame_rate: number | null;
  tracks: MuxTrack[];
}

export interface VideoFile {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  meta: MuxVideoMetadata | null;
  created_at: string;
  updated_at: string;
  likes_count: number;
  is_selected: boolean;
  visible: boolean;
  tags: string[] | null;
  flags: string[] | null;
  organization_id: string | null;
  parent_id: string | null;
}

// Types for User Profile Settings

export interface WorkflowAction {
  id: string;
  type: string;
  label: string;
  description: string;
}

export interface Workflow {
  id: string;
  name: string;
  actions: WorkflowAction[];
  createdAt: string;
}

export interface FilterPanelSettings {
  model: string;
  context: string;
  provider: string;
  selectionMode: string;
}

export interface QuickAction {
  id: string;
  icon: string;
  name: string;
  prompt: string;
}

export interface PromptPreset {
  id: string;
  name: string;
  prompt: string;
  createdAt: string;
}

export interface MarkdownWidgetSettings {
  model: string;
  provider: string;
}

export interface AITextGeneratorSettings {
  model: string;
  provider: string;
  contextMode: 'clear' | 'selection' | 'all';
  applicationMode: 'replace' | 'insert' | 'append';
  imageToolsEnabled: boolean;
}

export interface UserSettingsPromptTemplate {
  name: string;
  template: string;
}

export interface UserSettings {
  workflows?: Workflow[];
  filterPanel?: FilterPanelSettings;
  quickActions?: QuickAction[];
  promptHistory?: string[];
  promptPresets?: PromptPreset[];
  markdownWidget?: MarkdownWidgetSettings;
  aiTextGenerator?: AITextGeneratorSettings;
  promptTemplates?: UserSettingsPromptTemplate[];
}

export interface PostNavigationData {
  posts: {
    id: string;
    title: string;
    image_url: string;
    thumbnail_url?: string | null;
    user_id: string;
    type?: string;
    description?: string | null;
    created_at?: string;
    meta?: any;
    likes_count?: number;
    comments_count?: number;
  }[];
  currentIndex: number;
  source: 'home' | 'collection' | 'tag' | 'search' | 'user' | 'photogrid' | 'widget';
  sourceId?: string;
}
