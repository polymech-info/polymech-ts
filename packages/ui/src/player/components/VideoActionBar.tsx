/**
 * Video Action Bar Component (Right Side)
 * Based on deobfuscated TikTok action bar implementation
 */

import React, { useState } from 'react';
import { VideoItem } from '../types';
import { formatCount, getRelativeTime } from '../utils';

interface VideoActionBarProps {
  video: VideoItem;
  isLiked?: boolean;
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  onBookmark?: () => void;
  onFollow?: () => void;
  onAvatarClick?: (userId: string) => void;
  className?: string;
}

export const VideoActionBar: React.FC<VideoActionBarProps> = ({
  video,
  isLiked,
  onLike,
  onComment,
  onShare,
  onBookmark,
  onFollow,
  onAvatarClick,
  className = ''
}) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const handleLike = () => {
    onLike?.();
  };

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
    onFollow?.();
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    onBookmark?.();
  };

  return (
    <div className={`flex flex-col items-center justify-end space-y-4 p-4 min-w-[80px] ${className}`}>
      
      {/* Author Avatar and Follow Button */}
      <div className="flex flex-col items-center space-y-2">
        <button 
          onClick={() => onAvatarClick?.(video.author.id)} 
          className="relative focus:outline-none focus:ring-2 focus:ring-white rounded-full"
          aria-label={`View profile of ${video.author.nickname}`}
        >
          <img
            src={video.author.avatarThumb}
            alt={video.author.nickname}
            className="w-12 h-12 rounded-full border-2 border-white/20 object-cover"
            loading="lazy"
          />
          
          {/* Verified Badge */}
          {video.author.verified && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
            </div>
          )}
        </button>
        
        {/* Follow Button */}
        <button
          onClick={handleFollow}
          className={`w-6 h-6 rounded-full flex items-center justify-center text-white transition-all duration-200 hover:scale-110 ${
            isFollowing 
              ? 'bg-gray-600 hover:bg-gray-700' 
              : 'bg-tiktok-red hover:bg-red-600'
          }`}
          aria-label={isFollowing ? "Unfollow" : "Follow"}
        >
          {isFollowing ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
          )}
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col items-center space-y-6">
        
        {/* Like Button */}
        <button
          onClick={onLike}
          className={`flex flex-col items-center space-y-1 transition-colors group ${
            isLiked ? 'text-tiktok-red' : 'text-white hover:text-tiktok-red'
          }`}
          aria-label={`${isLiked ? 'Unlike' : 'Like'} video`}
        >
          <div className="p-2 rounded-full transition-all duration-200 group-hover:scale-110">
            <svg width="28" height="28" viewBox="0 0 24 24" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth={isLiked ? 0 : 2}>
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </div>
          <span className="text-xs font-semibold">
            {formatCount(video.stats.diggCount || 0)}
          </span>
        </button>

        {/* Comment Button */}
        <button
          onClick={onComment}
          className="flex flex-col items-center space-y-1 text-white hover:text-blue-400 transition-colors group"
          aria-label="View comments"
        >
          <div className="p-2 rounded-full transition-all duration-200 group-hover:scale-110">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21.99 4c0-1.1-.89-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18zM18 14H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
            </svg>
          </div>
          <span className="text-xs font-semibold">
            {formatCount(video.stats.commentCount || 0)}
          </span>
        </button>

        {/* Bookmark Button */}
        <button
          onClick={handleBookmark}
          className="flex flex-col items-center space-y-1 text-white hover:text-yellow-400 transition-colors group"
          aria-label={`${isBookmarked ? 'Remove bookmark' : 'Bookmark'} video`}
        >
          <div className={`p-2 rounded-full transition-all duration-200 group-hover:scale-110 ${
            isBookmarked ? 'text-yellow-400' : ''
          }`}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
            </svg>
          </div>
          <span className="text-xs font-semibold">
            {formatCount(video.stats.collectCount || 0)}
          </span>
        </button>

        {/* Share Button */}
        <button
          onClick={onShare}
          className="flex flex-col items-center space-y-1 text-white hover:text-green-400 transition-colors group"
          aria-label="Share video"
        >
          <div className="p-2 rounded-full transition-all duration-200 group-hover:scale-110">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
            </svg>
          </div>
          <span className="text-xs font-semibold">
            {formatCount(video.stats.shareCount || 0)}
          </span>
        </button>

        {/* Music Disc */}
        {video.music && (
          <div className="flex flex-col items-center space-y-1">
            <div 
              className="w-10 h-10 rounded-full bg-cover bg-center animate-spin-slow border-2 border-white/20 cursor-pointer hover:scale-110 transition-transform"
              style={{ 
                backgroundImage: `url("${video.music.coverMedium}")`,
                animationDuration: '3s'
              }}
              title={`${video.music.title} - ${video.music.authorName}`}
            />
          </div>
        )}
      </div>

      {/* Video Stats (Play Count, Time) */}
      <div className="flex flex-col items-center space-y-1 text-white/70 text-xs mt-4">
        <div className="flex items-center space-x-1">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
          </svg>
          <span>{formatCount(video.stats.playCount || 0)}</span>
        </div>
        
        {video.createTime && (
          <div className="text-center">
            {getRelativeTime(video.createTime)}
          </div>
        )}
      </div>
    </div>
  );
};
