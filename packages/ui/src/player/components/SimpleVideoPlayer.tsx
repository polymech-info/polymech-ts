/**
 * Simple Video Player Component
 * Simplified version for immediate testing
 */

import React, { useRef, useState, useEffect } from 'react';

interface SimpleVideoPlayerProps {
  src: string;
  poster?: string;
  isActive: boolean;
  muted?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
}

export const SimpleVideoPlayer: React.FC<SimpleVideoPlayerProps> = ({
  src,
  poster,
  isActive,
  muted = true,
  onPlay,
  onPause
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  // Auto-play when video becomes active
  useEffect(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    
    if (isActive && !isPlaying) {
      video.play().then(() => {
        setIsPlaying(true);
        onPlay?.();
      }).catch(console.error);
    } else if (!isActive && isPlaying) {
      video.pause();
      setIsPlaying(false);
      onPause?.();
    }
  }, [isActive, isPlaying, onPlay, onPause]);

  // Handle time updates
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    
    const video = videoRef.current;
    if (video.duration) {
      setProgress(video.currentTime / video.duration);
    }
  };

  // Handle metadata loaded
  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
  };

  // Toggle play/pause
  const togglePlay = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
      onPause?.();
    } else {
      video.play().then(() => {
        setIsPlaying(true);
        onPlay?.();
      }).catch(console.error);
    }
  };

  return (
    <div className="relative w-full h-full bg-black">
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        src={src}
        poster={poster}
        muted={muted}
        playsInline
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onClick={togglePlay}
      />

      {/* Simple Play/Pause Overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <button
          onClick={togglePlay}
          className={`bg-black/30 backdrop-blur-sm rounded-full p-4 text-white hover:bg-black/50 transition-all duration-200 ${
            isActive ? 'opacity-0 hover:opacity-100' : 'opacity-100'
          }`}
        >
          {isPlaying ? (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
            </svg>
          ) : (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
          )}
        </button>
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="w-full h-1 bg-white/20 rounded-full">
          <div 
            className="h-full bg-white rounded-full transition-all duration-100"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};
