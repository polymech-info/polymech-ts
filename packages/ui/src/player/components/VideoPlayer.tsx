/**
 * Main Video Player Component
 * Based on deobfuscated TikTok video player implementation
 */

import React, { useRef, useEffect, lazy, Suspense } from 'react';
import { VideoItem } from '../types';
import type { MediaPlayerInstance } from '@vidstack/react';


// Lazy load Vidstack implementation
const VidstackPlayer = lazy(() => import('./VidstackPlayerImpl').then(module => ({ default: module.VidstackPlayerImpl })));

interface VideoPlayerProps {
  video: VideoItem;
  isActive: boolean;
  isMuted: boolean;
  autoPlay: boolean;
  onPlayerChange: (player: MediaPlayerInstance | null) => void;
  className?: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  video,
  isActive,
  isMuted,
  autoPlay,
  onPlayerChange,
  className = ''
}) => {
  const player = useRef<MediaPlayerInstance>(null);
  console.log('autoPlay ' + video.video.playAddr, autoPlay, video);

  useEffect(() => {
    // player.current.muted = false;
  }, []);

  useEffect(() => {
    // Pass the player instance to the parent component.
    onPlayerChange(player.current);
  }, [onPlayerChange]);

  useEffect(() => {
    // This effect ensures that the mute state of the player is always in sync
    // with the global mute state managed by the VideoFeed component.
    if (player.current) {
      player.current.muted = isMuted;
    }
  }, [isMuted]);

  return (
    <div className={`w-full h-full bg-black flex justify-center items-center ${className}`}>
      {/* Video Player - Using Vidstack for HLS support */}
      {/* Video Player - Using Vidstack for HLS support */}
      <Suspense fallback={<div className="w-full h-full bg-black animate-pulse" />}>
        <VidstackPlayer
          ref={player}
          title={video.desc || 'Video'}
          src={
            video.video.playAddr.includes('/api/videos/')
              ? { src: video.video.playAddr, type: 'video/mp4' }
              : video.video.playAddr
          }
          poster={video.video.cover}
          playsInline
          loop
          muted={false}
          autoPlay={true}
          load={isActive ? "eager" : "idle"}
          posterLoad="eager"
          crossOrigin="anonymous"
          className="w-full h-full"
          style={{
            '--video-brand': '#ff0050',
            '--media-object-fit': 'contain',
            '--media-object-position': 'center'
          } as any}
          layoutProps={{
            noScrubGesture: true
          }}
        />
      </Suspense>
    </div>
  );
};
