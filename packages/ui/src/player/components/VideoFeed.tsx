/**
 * Video Feed Container Component
 * Based on deobfuscated TikTok infinite scroll implementation
 */

import React, { useCallback, useEffect, useState, useRef } from 'react';
import { VideoItem } from '../types';
import { useInfiniteScroll } from '../hooks';
import { VideoPlayer } from './VideoPlayer';
import { VideoActionBar } from './VideoActionBar';
import { VideoMetadata } from './VideoMetadata';
import Comments from '@/components/Comments';
import type { MediaPlayerInstance } from '@vidstack/react';

interface VideoFeedProps {
  videos: VideoItem[];
  likedVideos?: Set<string>;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loading?: boolean;
  autoplay?: boolean;
  muted?: boolean;
  onVideoChange?: (index: number) => void;
  onLike?: (videoId: string) => void;
  onComment?: (videoId: string) => void;
  onShare?: (videoId: string) => void;
  onFollow?: (userId: string) => void;
  onAvatarClick?: (userId: string) => void;
  className?: string;
}

export const VideoFeed: React.FC<VideoFeedProps> = ({
  videos,
  likedVideos,
  onLoadMore,
  hasMore = true,
  loading = false,
  autoplay = true,
  muted = true,
  onVideoChange,
  onLike,
  onComment,
  onShare,
  onFollow,
  onAvatarClick,
  className = ''
}) => {
  const [showComments, setShowComments] = useState(false);
  const [activeCommentVideoId, setActiveCommentVideoId] = useState<string | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(muted);
  const [isFirstPlay, setIsFirstPlay] = useState(false); // Set to false to enable autoplay from the start
  
  const playerRefs = useRef<(MediaPlayerInstance | null)[]>([]);

  // Infinite scroll hook
  const infiniteScroll = useInfiniteScroll(videos, {
    onLoadMore,
    hasMore,
    onVideoChange: (index) => {
      if (index !== currentIndex) {
        setCurrentIndex(index);
        onVideoChange?.(index);
      }
    }
  });

  useEffect(() => {
    playerRefs.current = playerRefs.current.slice(0, videos.length);
  }, [videos]);

  useEffect(() => {
    // Pause all other videos when currentIndex changes
    playerRefs.current.forEach((player, index) => {
      if (player && index !== currentIndex) {
        player.pause();
      }
    });
    // The active video will autoplay via the `autoPlay` prop on the VideoPlayer
  }, [currentIndex, videos]);


  // Handle comment button click
  const handleCommentClick = useCallback((videoId: string) => {
    setActiveCommentVideoId(videoId);
    setShowComments(true);
    onComment?.(videoId);
  }, [onComment]);

  // Handle share button click
  const handleShareClick = useCallback((videoId: string) => {
    // Copy video URL to clipboard
    const videoUrl = `${window.location.origin}/video/${videoId}`;
    navigator.clipboard?.writeText(videoUrl).then(() => {
      console.log('Video URL copied to clipboard');
    });
    onShare?.(videoId);
  }, [onShare]);

  const togglePlay = () => {
    const currentPlayer = playerRefs.current[currentIndex];
    if (currentPlayer) {
      if (currentPlayer.state.playing) {
        currentPlayer.pause();
      } else {
        currentPlayer.play().catch(e => console.warn("Toggle play failed", e));
      }
    }
  };
  
  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case ' ':
          event.preventDefault();
          togglePlay();
          break;
        case 'ArrowUp':
          event.preventDefault();
          if (infiniteScroll.prevVideo) {
            infiniteScroll.prevVideo();
          }
          break;
        case 'ArrowDown':
          event.preventDefault();
          if (infiniteScroll.nextVideo) {
            infiniteScroll.nextVideo();
          }
          break;
        case 'm':
        case 'M':
          event.preventDefault();
          toggleMute();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [infiniteScroll, togglePlay, toggleMute]);

  return (
    <div className={`h-screen w-full bg-black ${className}`}>
      
      {/* Main Video Feed Container */}
      <div
        ref={infiniteScroll.containerRef}
        className="h-full w-full overflow-y-scroll overflow-x-hidden snap-y snap-mandatory scrollbar-hide"
        style={{ scrollBehavior: 'smooth' }}
      >
        {videos.map((video, index) => {
          const isActive = index === currentIndex;
          
          return (
            <article
              key={video.id}
              ref={(el) => {
                if (infiniteScroll.registerVideoRef) {
                  infiniteScroll.registerVideoRef(index, el);
                }
              }}
              data-scroll-index={index}
              className="h-screen w-full snap-start flex relative"
              style={{ scrollSnapAlign: 'start' }}
            >
              
              {/* Main content container (video + metadata) */}
              <div className="flex-1 min-w-0 h-full relative" onClick={togglePlay}>
                <VideoPlayer
                  video={video}
                  isActive={isActive}
                  isMuted={isMuted}
                  autoPlay={isActive && !isFirstPlay}
                  onPlayerChange={(player) => {
                    playerRefs.current[index] = player;
                  }}
                />

                {/* Video Metadata Overlay */}
                <VideoMetadata
                  video={video}
                  onHashtagClick={(hashtag) => {
                    console.log('Hashtag clicked:', hashtag);
                    // Handle hashtag navigation
                  }}
                  onMentionClick={(username) => {
                    console.log('Mention clicked:', username);
                    // Handle user profile navigation
                  }}
                />

                {/* "Click to Play" overlay is removed to allow autoplay */}
                
                {/* Loading Indicator */}
                {/* Implement a loading state based on player.state.waiting */}

                {/* Error State - Can be disabled with VITE_ENABLE_VIDEO_ERROR_OVERLAY=false */}
                {/* Implement error state based on player.state.error */}
              </div>

              {/* Action Bar */}
              <VideoActionBar
                video={video}
                isLiked={likedVideos?.has(video.id)}
                onLike={() => onLike?.(video.id)}
                onComment={() => handleCommentClick(video.id)}
                onShare={() => handleShareClick(video.id)}
                onBookmark={() => console.log('Bookmark:', video.id)}
                onFollow={() => onFollow?.(video.author.id || '')}
                onAvatarClick={onAvatarClick}
                className="absolute bottom-24 right-2 z-20"
              />
            </article>
          );
        })}

        {/* Loading More Indicator */}
        {loading && (
          <div className="h-screen flex items-center justify-center bg-black">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
              <div>Loading more videos...</div>
            </div>
          </div>
        )}

        {/* End of Feed */}
        {!hasMore && videos.length > 0 && (
          <div className="h-screen flex items-center justify-center bg-black">
            <div className="text-white text-center">
              <div className="text-2xl mb-2">🎉</div>
              <div>You've reached the end!</div>
              <button
                onClick={() => {
                  if (infiniteScroll.scrollToVideo) {
                    infiniteScroll.scrollToVideo(0);
                  }
                }}
                className="mt-4 px-6 py-2 bg-tiktok-red rounded-full text-white hover:bg-red-600 transition-colors"
              >
                Back to Top
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Indicators */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 z-20 flex flex-col space-y-1">
        {videos.slice(
          Math.max(0, currentIndex - 2),
          currentIndex + 3
        ).map((_, relativeIndex) => {
          const actualIndex = Math.max(0, currentIndex - 2) + relativeIndex;
          const isActive = actualIndex === currentIndex;
          
          return (
            <button
              key={actualIndex}
              onClick={() => {
                if (infiniteScroll.scrollToVideo) {
                  infiniteScroll.scrollToVideo(actualIndex);
                }
              }}
              className={`w-1 h-6 rounded-full transition-all duration-200 ${
                isActive 
                  ? 'bg-white' 
                  : 'bg-white/30 hover:bg-white/50'
              }`}
              aria-label={`Go to video ${actualIndex + 1}`}
            />
          );
        })}
      </div>

      {/* Comments Panel (placeholder) */}
      {showComments && activeCommentVideoId && (
        <div className="absolute inset-0 bg-black/50 z-30 flex items-end">
          <div className="w-full h-2/3 bg-background text-foreground rounded-t-2xl p-4 overflow-y-auto">
            <div className="flex justify-between items-center mb-4 sticky top-0 bg-background py-2">
              <h3 className="text-lg font-semibold">Comments</h3>
              <button
                onClick={() => setShowComments(false)}
                className="p-2 hover:bg-accent rounded-full"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>
            <Comments pictureId={activeCommentVideoId} />
          </div>
        </div>
      )}
    </div>
  );
};
