/**
 * TikTok Video Player Types
 * Based on deobfuscated TikTok source code
 */

// Core Video Types
export interface VideoItem {
  id: string;
  author: {
    nickname?: string;
    uniqueId?: string;
    id?: string;
    secUid?: string;
    avatarThumb?: string;
    verified?: boolean;
  };
  video: {
    width?: number;
    height?: number;
    duration?: number;
    ratio?: string;
    playAddr?: string;
    downloadAddr?: string;
    cover?: string;
    dynamicCover?: string;
  };
  stats: {
    diggCount?: number;
    playCount?: number;
    shareCount?: number;
    commentCount?: number;
    collectCount?: number;
  };
  desc?: string;
  createTime?: number;
  isPinnedItem?: boolean;
  imagePost?: {
    images: Array<{ url: string }>;
  };
  music?: {
    id: string;
    title: string;
    playUrl: string;
    coverMedium: string;
    authorName: string;
  };
  challenges?: Array<{
    id: string;
    title: string;
    desc: string;
  }>;
  effectStickers?: Array<{
    id: string;
    name: string;
    iconUrl: string;
  }>;
}

// Video Player State Management
export interface VideoDetailState {
  currentIndex: number;
  itemListKey: ItemListKey;
  subtitleContent: SubtitleCue[];
  ifShowSubtitle: boolean;
  subtitleStruct: SubtitleStruct | null;
  seekType: SeekType;
  playMode: PlayMode;
  isScrollGuideVisible: boolean;
  isYmlRightPanelVisible: boolean;
}

// Swiper Navigation State
export interface SwiperModeState {
  currentIndex: Record<string, number>;
  disabled: boolean;
  itemListKey: ItemListKey;
  onboardingShowing: boolean;
  loginCTAShowing: boolean;
  leavingModalShowing: boolean;
  playbackRate: number;
  dimmer: boolean;
  showBrowseMode: boolean;
  needLeavingModal: boolean;
  iconType: IconType;
  seekType: SeekType;
}

// Subtitle Types
export interface SubtitleStruct {
  url: string;
  language: string;
  expire?: number;
}

export interface SubtitleCue {
  start: number;
  end: number;
  text: string;
  startStr: string;
}

export interface SubtitleInfo {
  Version: string;
  Format: SubtitleFormat;
  Url: string;
  LanguageCodeName: string;
  UrlExpire?: number;
}

// Comment System Types
export interface CommentItem {
  cid: string;
  user: string;
  text: string;
  createTime: number;
  user_digged: boolean;
  is_author_digged: boolean;
  digg_count: number;
  reply_comment_total: number;
  reply_comment?: CommentItem[];
  replyCache?: {
    comments: CommentItem[];
    cursor: string;
    hasMore: boolean;
    loading: boolean;
  };
  comment_language?: string;
}

export interface VideoCommentState {
  awemeId?: string;
  cursor: string;
  comments: CommentItem[];
  hasMore: boolean;
  loading: boolean;
  isFirstLoad: boolean;
  fetchType: 'load_by_current' | 'preload_by_ml';
  currentAspect: 'all' | string;
}

// Enums
export enum PlayMode {
  VideoDetail = "video_detail",
  OneColumn = "one_column",
  MiniPlayer = "mini_player"
}

export enum SeekType {
  None = "none",
  Forward = "forward",
  Backward = "backward",
  Scrub = "scrub"
}

export enum IconType {
  None = "none",
  Mute = "mute",
  Unmute = "unmute",
  Play = "play",
  Pause = "pause"
}

export enum EnterMethod {
  VideoDetailPage = "video_detail_page",
  VideoCoverClick = "video_cover_click",
  VideoCoverClickAIGCDesc = "video_cover_click_aigc_desc",
  VideoErrorAutoReload = "video_error_auto_reload",
  CreatorCard = "creator_card",
  ClickButton = "click_button"
}

export enum SubtitleFormat {
  WebVTT = "webvtt",
  CreatorCaption = "creator_caption"
}

export enum ItemListKey {
  Video = "video",
  SearchTop = "search_top",
  SearchVideo = "search_video",
  SearchPhoto = "search_photo"
}

export enum StatusCode {
  Ok = 0,
  UnknownError = -1,
  NetworkError = -2
}

// Component Props
export interface VideoPlayerProps {
  videos: VideoItem[];
  currentIndex?: number;
  onVideoChange?: (index: number) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loading?: boolean;
  autoplay?: boolean;
  muted?: boolean;
  controls?: boolean;
  className?: string;
}

export interface VideoItemProps {
  video: VideoItem;
  index: number;
  isActive: boolean;
  onSelect: () => void;
  onLoad?: () => void;
}

export interface CommentSystemProps {
  videoId: string;
  comments?: CommentItem[];
  onLoadMore?: () => void;
  onAddComment?: (text: string) => void;
  onLikeComment?: (commentId: string) => void;
  onReplyComment?: (commentId: string, text: string) => void;
}

// Hook Return Types
export interface UseVideoPlayerReturn {
  currentIndex: number;
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  progress: number;
  duration: number;
  buffered: number;
  isLoading: boolean;
  error: string | null;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  seek: (time: number) => void;
  nextVideo: () => void;
  prevVideo: () => void;
  clearError: () => void;
  setCurrentIndex?: (index: number) => void;
  videoRef?: React.RefObject<HTMLVideoElement>;
  getVideoElement?: () => HTMLVideoElement | null;
  seekType?: SeekType;
  playMode?: PlayMode;
  currentVideo?: VideoItem;
}

export interface UseInfiniteScrollReturn {
  containerRef: React.RefObject<HTMLDivElement>;
  currentIndex: number;
  isLoading: boolean;
  handleScroll: () => void;
  registerVideoRef?: (index: number, element: HTMLElement | null) => void;
  scrollToVideo?: (index: number) => void;
  nextVideo?: () => void;
  prevVideo?: () => void;
}

// Mux Integration Types (for future use)
export interface MuxVideoSource {
  playbackId: string;
  aspectRatio?: string;
  duration?: number;
  maxResolution?: string;
  status?: 'preparing' | 'ready' | 'errored';
}

// Analytics Types
export interface VideoAnalytics {
  videoId: string;
  watchTime: number;
  completionRate: number;
  interactions: {
    likes: number;
    shares: number;
    comments: number;
  };
  timestamp: number;
}

// Error Types
export interface VideoError {
  code: string;
  message: string;
  details?: any;
}

// Configuration Types
export interface PlayerConfig {
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  preload?: 'none' | 'metadata' | 'auto';
  crossOrigin?: 'anonymous' | 'use-credentials';
  playsInline?: boolean;
  controls?: boolean;
  poster?: string;
}
