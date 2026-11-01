import { Heart, Download, Share2, MessageCircle, Edit3, Trash2, Layers, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deletePictures } from "@/modules/posts/client-pictures";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import React, { useState, useEffect, useRef } from "react";
import MarkdownRenderer from "@/components/MarkdownRenderer";

import { useNavigate, useLocation } from "react-router-dom";
import { T, translate } from "@/i18n";
import type { MuxResolution } from "@/types";
import EditVideoModal from "@/components/EditVideoModal";
import { detectMediaType, MEDIA_TYPES } from "@/lib/mediaRegistry";
import UserAvatarBlock from "@/components/UserAvatarBlock";
import { formatDate, isLikelyFilename } from "@/utils/textUtils";
import type { CardPreset } from '@/modules/pages/PageCard';

// import {
//   MediaPlayer, MediaProvider, type MediaPlayerInstance
// } from '@vidstack/react';
import type { MediaPlayerInstance } from '@vidstack/react';
import { serverUrl } from "@/lib/db";

// Import Vidstack styles
// import '@vidstack/react/player/styles/default/theme.css';
// import '@vidstack/react/player/styles/default/layouts/video.css';

// Lazy load Vidstack implementation
const VidstackPlayer = React.lazy(() => import('../player/components/VidstackPlayerImpl').then(module => ({ default: module.VidstackPlayerImpl })));

interface VideoCardProps {
  videoId: string;
  videoUrl: string;
  thumbnailUrl?: string;
  title: string;
  author: string;
  authorId: string;
  likes: number;
  comments: number;
  isLiked?: boolean;
  description?: string | null;
  onClick?: (videoId: string) => void;
  onLike?: () => void;
  onDelete?: () => void;
  maxResolution?: MuxResolution;
  authorAvatarUrl?: string | null;
  showContent?: boolean;

  created_at?: string;
  job?: any;
  variant?: 'grid' | 'feed';
  showPlayButton?: boolean;
  apiUrl?: string;
  showTitle?: boolean;
  showDescription?: boolean;
  showAuthor?: boolean;
  showActions?: boolean;
  preset?: CardPreset;
}

const VideoCard = ({
  videoId,
  videoUrl,
  thumbnailUrl,
  title,
  author,
  authorId,
  likes,
  comments,
  isLiked = false,
  description,
  onClick,
  onLike,
  onDelete,
  maxResolution = '270p',
  authorAvatarUrl,
  showContent = true,
  showPlayButton = false,

  created_at,
  job,
  variant = 'grid',
  apiUrl,
  showTitle,
  showDescription,
  showAuthor = true,
  showActions = true,
  preset
}: VideoCardProps) => {
  const { user } = useAuth();
  const titleVisible = (showTitle ?? preset?.showTitle) !== false;
  const descriptionVisible = (showDescription ?? preset?.showDescription) !== false;
  const navigate = useNavigate();
  const location = useLocation();
  const [localIsLiked, setLocalIsLiked] = useState(isLiked);
  const [localLikes, setLocalLikes] = useState(likes);
  const [isDeleting, setIsDeleting] = useState(false);
  const [versionCount, setVersionCount] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const player = useRef<MediaPlayerInstance>(null);

  // Stop playback on navigation & Cleanup
  useEffect(() => {
    const handleNavigation = () => {
      setIsPlaying(false);
      player.current?.pause();
    };

    handleNavigation();

    return () => {
      player.current?.pause();
    };
  }, [location.pathname]);
  const [processingStatus, setProcessingStatus] = useState<'active' | 'completed' | 'failed' | 'unknown'>('unknown');
  const [progress, setProgress] = useState(0);
  const [videoMeta, setVideoMeta] = useState<any>(null);

  const isOwner = user?.id === authorId;
  const mediaType = detectMediaType(videoUrl);
  const isInternalVideo = mediaType === MEDIA_TYPES.VIDEO_INTERN;
  const isExternalVideo = mediaType === MEDIA_TYPES.VIDEO_EXTERN;

  // Normalize URLs: DB may store relative paths or old localhost URLs.
  // Extracts the /api/ path and prepends the configured server base.
  const rewriteUrl = (url: string): string => {
    if (!url) return url;
    const serverBase = serverUrl;
    if (!serverBase) return url;
    const apiIdx = url.indexOf('/api/');
    if (apiIdx !== -1) return `${serverBase}${url.slice(apiIdx)}`;
    return url;
  };

  const normalizedVideoUrl = isInternalVideo ? rewriteUrl(videoUrl) : videoUrl;
  const normalizedThumbnailUrl = isInternalVideo ? rewriteUrl(thumbnailUrl || '') : thumbnailUrl;

  // Handle poster URL based on media type
  const posterUrl = (() => {
    if (!normalizedThumbnailUrl) return undefined;

    if (isInternalVideo || isExternalVideo) {
      return normalizedThumbnailUrl; // Use direct thumbnail for internal videos
    }

    // Default to Mux behavior
    return `${normalizedThumbnailUrl}?width=640&height=640&fit_mode=smartcrop&time=0`;
  })();

  // Add max_resolution query parameter to video URL for bandwidth optimization
  // See: https://www.mux.com/docs/guides/control-playback-resolution
  const getVideoUrlWithResolution = (url: string) => {
    if (isInternalVideo || isExternalVideo) return url; // Internal videos handle quality differently (via HLS/presets in future)

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

  const playbackUrl = getVideoUrlWithResolution(normalizedVideoUrl);

  // Fetch version count for owners only
  useEffect(() => {
    const fetchVersionCount = async () => {
      if (!isOwner || !user) return;
      return;
    };

    fetchVersionCount();

  }, [videoId, isOwner, user]);

  // Handle Video Processing Status (SSE)
  useEffect(() => {
    if (!isInternalVideo) return;

    // 1. Use verified job data from server if available (e.g. from Feed)
    if (job) {
      if (job.status === 'completed') {
        setProcessingStatus('completed');
        // If we have a verified resultUrl, we might want to use it? 
        // But the parent component passes `videoUrl`, so we assume parent updated it or logic below handles it.
        return;
      }
      if (job.status === 'failed') {
        setProcessingStatus('failed');
        return;
      }
      // If active, we fall through to start SSE below, but init state first
      setProcessingStatus('active');
      setProgress(job.progress || 0);
    }

    // Extract Job ID from URL
    // Format: .../api/videos/jobs/:jobId/... (regex: /api/videos/jobs/([^/]+)\//)
    const match = normalizedVideoUrl.match(/\/api\/videos\/jobs\/([^\/]+)\//) || (job ? [null, job.id] : null);
    if (!match) return;

    const jobId = match[1];
    const baseUrl = serverUrl || '';

    let eventSource: EventSource | null = null;
    let isMounted = true;

    const checkStatusAndConnect = async () => {
      if (!jobId) return;
      try {
        const res = await fetch(`${baseUrl}/api/videos/jobs/${jobId}`);
        if (!res.ok) throw new Error('Failed to fetch job');
        const data = await res.json();

        if (!isMounted) return;

        if (data.status === 'completed') {
          setProcessingStatus('completed');
          return;
        } else if (data.status === 'failed') {
          setProcessingStatus('failed');
          return;
        }

        // Only connect SSE if still active/created/waiting
        setProcessingStatus('active');
        const sseUrl = `${baseUrl}/api/videos/jobs/${jobId}/progress`;
        eventSource = new EventSource(sseUrl);

        eventSource.addEventListener('progress', (e) => {
          if (!isMounted) return;
          try {
            const data = JSON.parse((e as MessageEvent).data);
            if (data.progress !== undefined) {
              setProgress(Math.round(data.progress));
            }
            if (data.status) {
              if (data.status === 'completed') {
                setProcessingStatus('completed');
                eventSource?.close();
              } else if (data.status === 'failed') {
                setProcessingStatus('failed');
                eventSource?.close();
              } else {
                setProcessingStatus('active');
              }
            }
          } catch (err) {
            console.error('SSE Parse Error', err);
          }
        });

        eventSource.onerror = (e) => {
          eventSource?.close();
          // Fallback check handled by initial check logic or user refresh
          // But we can retry once
        };

      } catch (error) {
        console.error('Error checking video status:', error);
        if (isMounted) setProcessingStatus('unknown');
      }
    };

    checkStatusAndConnect();

    return () => {
      isMounted = false;
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [isInternalVideo, normalizedVideoUrl, job]);

  const handleCancelProcessing = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Cancel this upload?')) return;

    const match = normalizedVideoUrl.match(/\/api\/videos\/jobs\/([^\/]+)\//);
    if (!match) return;

    const jobId = match[1];
    const baseUrl = serverUrl || '';
    try {
      await fetch(`${baseUrl}/api/videos/jobs/${jobId}`, {
        method: 'DELETE'
      });
      toast.info(translate('Upload cancelled'));
      // Trigger delete to remove from UI
      onDelete?.();
    } catch (err) {
      console.error('Failed to cancel', err);
      toast.error(translate('Failed to cancel upload'));
    }
  };


  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!user) {
      toast.error(translate('Please sign in to like videos'));
      return;
    }

    try {
      if (localIsLiked) {
        // Unlike - need to implement video likes table
        toast.info('Video likes coming soon');
      } else {
        // Like - need to implement video likes table
        toast.info('Video likes coming soon');
      }

      onLike?.();
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error(translate('Failed to update like'));
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!user || !isOwner) {
      toast.error(translate('You can only delete your own videos'));
      return;
    }

    if (!confirm(translate('Are you sure you want to delete this video? This action cannot be undone.'))) {
      return;
    }

    setIsDeleting(true);
    try {
      // Delete via API (handles DB + storage cleanup internally)
      await deletePictures([videoId]);

      toast.success(translate('Video deleted successfully'));
      onDelete?.(); // Trigger refresh of the parent component
    } catch (error) {
      console.error('Error deleting video:', error);
      toast.error(translate('Failed to delete video'));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownload = async () => {
    try {
      const link = document.createElement('a');
      link.href = videoUrl;
      link.download = `${title}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(translate('Video download started'));
    } catch (error) {
      console.error('Error downloading video:', error);
      toast.error(translate('Failed to download video'));
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClick?.(videoId);
  };

  // Handle global stop-video event
  useEffect(() => {
    const handleStopVideo = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.sourceId !== videoId && isPlaying) {
        setIsPlaying(false);
        player.current?.pause();
      }
    };

    window.addEventListener('stop-video', handleStopVideo);
    return () => window.removeEventListener('stop-video', handleStopVideo);
  }, [isPlaying, videoId]);

  const handlePlayClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Stop other videos
    window.dispatchEvent(new CustomEvent('stop-video', { detail: { sourceId: videoId } }));

    setIsPlaying(true);
  };

  return (
    <div
      data-testid="video-card"
      className="group relative overflow-hidden bg-card transition-all duration-300 cursor-pointer w-full"
      onClick={handleClick}
    >
      {/* Video Player - usage square aspect to match PhotoCard unless variant is feed */}
      <div className={`${variant === 'grid' ? "aspect-square" : "w-full"} overflow-hidden relative`}>
        {!isPlaying ? (
          // Show thumbnail with play button overlay
          <>
            <img
              src={posterUrl || '/placeholder.svg'}
              alt={title}
              className="w-full h-full object-cover"
            />
            {/* Processing Overlay */}
            {isInternalVideo && processingStatus !== 'completed' && processingStatus !== 'unknown' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-10">
                {processingStatus === 'failed' ? (
                  <div className="text-red-500 flex flex-col items-center">
                    <span className="text-sm font-medium">Processing Failed</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-white space-y-2">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />

                    <span className="text-xs font-medium">Processing {progress}%</span>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-6 text-xs mt-2"
                      onClick={handleCancelProcessing}
                    >
                      <X className="w-3 h-3 mr-1" /> Cancel
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Play Button Overlay */}
            {showPlayButton && (!isInternalVideo || processingStatus === 'completed' || processingStatus === 'unknown') && (
              <button
                onClick={handlePlayClick}
                className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors group"
                aria-label="Play video"
              >
                <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center group-hover:bg-white group-hover:scale-110 transition-all">
                  <svg
                    className="w-8 h-8 text-black ml-1"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </button>
            )}
          </>
        ) : (
          // Show MediaPlayer when playing
          <React.Suspense fallback={<div className="w-full h-full bg-black animate-pulse flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-white" /></div>}>
            <VidstackPlayer
              key={videoId}
              ref={player}
              title={title}
              src={
                playbackUrl.includes('.m3u8')
                  ? { src: playbackUrl, type: 'application/x-mpegurl' }
                  : (job?.resultUrl && job.status === 'completed')
                    ? { src: job.resultUrl, type: 'application/x-mpegurl' }
                    : playbackUrl.includes('/api/videos/jobs')
                      ? { src: playbackUrl, type: 'video/mp4' }
                      : playbackUrl
              }
              poster={posterUrl}
              fullscreenOrientation="any"
              controls
              playsInline
              className={`w-full ${variant === 'grid' ? "h-full" : ""}`}
              layoutProps={{}}
            />
          </React.Suspense>
        )}
      </div>

      {/* TESTING: Entire desktop hover overlay disabled */}
      {false && showContent && variant === 'grid' && !isPlaying && (
        <div className="hidden md:block absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-auto">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <UserAvatarBlock
                  userId={authorId}
                  avatarUrl={authorAvatarUrl}
                  displayName={author}
                  hoverStyle={true}
                  showDate={false}
                />
              </div>
              <div className="flex items-center space-x-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleLike}
                  className={`h-8 w-8 p-0 ${localIsLiked ? "text-red-500" : "text-white hover:text-red-500"
                    }`}
                >
                  <Heart className="h-4 w-4" fill={localIsLiked ? "currentColor" : "none"} />
                </Button>
                <span className="text-white text-sm">{localLikes}</span>

                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-white hover:text-blue-400 ml-2"
                >
                  <MessageCircle className="h-4 w-4" />
                </Button>
                <span className="text-white text-sm">{comments}</span>

                {isOwner && (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowEditModal(true);
                      }}
                      className="h-8 w-8 p-0 text-white hover:text-green-400 ml-2"
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="h-8 w-8 p-0 text-white hover:text-red-400 ml-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>

                    {versionCount > 1 && (
                      <div className="flex items-center ml-2 px-2 py-1 bg-white/20 rounded text-white text-xs">
                        <Layers className="h-3 w-3 mr-1" />
                        {versionCount}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* TESTING: hover title+description disabled
            <h3 className="text-white font-medium mb-1">{title}</h3>
            {description && (
              <div className="text-white/80 text-sm mb-3 line-clamp-3 overflow-hidden">
                <MarkdownRenderer content={description} className="prose-invert prose-white" />
              </div>
            )}
            */}

            <div className="flex items-center space-x-1">
              <Button
                size="sm"
                variant="secondary"
                className="h-6 px-2 text-xs bg-white/20 hover:bg-white/30 border-0 text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload();
                }}
              >
                <Download className="h-3 w-3 mr-1" />
                <T>Download</T>
              </Button>
              <Button size="sm" variant="secondary" className="h-6 w-6 p-0 bg-white/20 hover:bg-white/30 border-0 text-white">
                <Share2 className="h-2.5 w-2.5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile/Feed Content - always visible below video */}
      {showContent && (variant === 'feed' || (variant === 'grid' && true)) && (
        <div className={`${variant === 'grid' ? "md:hidden" : ""} pb-2 space-y-2`}>
          {/* Row 1: Avatar + Actions */}
          <div className="flex items-center justify-between px-2 pt-2">
            {showAuthor && (
              <UserAvatarBlock
                userId={authorId}
                avatarUrl={authorAvatarUrl}
                displayName={author === 'User' ? undefined : author}
                className="w-8 h-8"
                showDate={false}
              />
            )}
            {showActions && (
              <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="ghost"
                onClick={handleLike}
                className={localIsLiked ? "text-red-500 hover:text-red-600" : ""}
              >
                <Heart className="h-6 w-6" fill={localIsLiked ? "currentColor" : "none"} />
              </Button>
              {localLikes > 0 && (
                <span className="text-sm font-medium text-foreground mr-1">{localLikes}</span>
              )}

              <Button
                size="icon"
                variant="ghost"
                className="text-foreground"
              >
                <MessageCircle className="h-6 w-6 -rotate-90" />
              </Button>
              {comments > 0 && (
                <span className="text-sm font-medium text-foreground mr-1">{comments}</span>
              )}

              <Button
                size="icon"
                variant="ghost"
                className="text-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload();
                }}
              >
                <Download className="h-6 w-6" />
              </Button>

              {isOwner && (
                <>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowEditModal(true);
                    }}
                    className="text-foreground hover:text-green-400"
                  >
                    <Edit3 className="h-6 w-6" />
                  </Button>
                </>
              )}
            </div>
            )}
          </div>

          {/* Likes */}


          {/* Caption / Description section */}
          <div className="px-4 space-y-1">
            {titleVisible && (!isLikelyFilename(title) && title) && (
              <div className="font-semibold text-sm">{title}</div>
            )}

            {descriptionVisible && description && (
              <div className="text-sm text-foreground/90 line-clamp-3 pl-8">
                <MarkdownRenderer content={description} className="prose-sm dark:prose-invert" />
              </div>
            )}

            {created_at && (
              <div className="text-xs text-muted-foreground pt-1">
                {formatDate(created_at)}
              </div>
            )}
          </div>
        </div>
      )}

      {showEditModal && (
        <EditVideoModal
          open={showEditModal}
          onOpenChange={setShowEditModal}
          videoId={videoId}
          currentTitle={title}
          currentDescription={description || null}
          currentVisible={true} // Default to true until we can properly pass this
          onUpdateSuccess={() => {
            setShowEditModal(false);
            onDelete?.(); // Trigger refresh
          }}
        />
      )}
    </div>
  );
};

export default VideoCard;
