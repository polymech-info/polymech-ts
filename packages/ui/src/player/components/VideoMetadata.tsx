/**
 * Video Metadata Overlay Component
 * Based on deobfuscated TikTok video metadata display
 */

import React, { useState } from 'react';
import { VideoItem } from '../types';

interface VideoMetadataProps {
  video: VideoItem;
  onHashtagClick?: (hashtag: string) => void;
  onMentionClick?: (username: string) => void;
  className?: string;
}

export const VideoMetadata: React.FC<VideoMetadataProps> = ({
  video,
  onHashtagClick,
  onMentionClick,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Parse description with hashtags and mentions
  const parseDescription = (text: string) => {
    if (!text) return [];

    const parts = [];
    const hashtagRegex = /#(\w+)/g;
    const mentionRegex = /@(\w+)/g;
    
    let lastIndex = 0;
    const matches = [];

    // Find all hashtags and mentions
    let match;
    while ((match = hashtagRegex.exec(text)) !== null) {
      matches.push({
        type: 'hashtag',
        content: match[0],
        value: match[1],
        index: match.index
      });
    }

    // Reset regex
    hashtagRegex.lastIndex = 0;
    
    while ((match = mentionRegex.exec(text)) !== null) {
      matches.push({
        type: 'mention',
        content: match[0],
        value: match[1],
        index: match.index
      });
    }

    // Sort matches by index
    matches.sort((a, b) => a.index - b.index);

    // Build parts array
    matches.forEach((match, i) => {
      // Add text before match
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: text.slice(lastIndex, match.index)
        });
      }

      // Add match
      parts.push(match);

      lastIndex = match.index + match.content.length;
    });

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push({
        type: 'text',
        content: text.slice(lastIndex)
      });
    }

    return parts;
  };

  const descriptionParts = parseDescription(video.desc || '');
  const shouldShowMore = (video.desc || '').length > 100;

  return (
    <div className={`absolute bottom-4 left-4 right-24 z-30 ${className}`}>
      <div className="space-y-2">
        
        {/* Author Info */}
        <div className="flex items-center space-x-2">
          <button
            className="text-white font-semibold hover:underline focus:outline-none focus:underline transition-colors"
            onClick={() => onMentionClick?.(video.author.uniqueId || '')}
          >
            @{video.author.uniqueId || video.author.nickname}
          </button>
          
          {video.author.verified && (
            <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
            </div>
          )}
        </div>

        {/* Video Description */}
        {video.desc && (
          <div className="text-white">
            <div 
              className={`text-sm leading-relaxed whitespace-pre-wrap ${
                isExpanded ? '' : 'line-clamp-2'
              }`}
            >
              {descriptionParts.map((part, index) => {
                if (part.type === 'hashtag') {
                  return (
                    <button
                      key={index}
                      onClick={() => onHashtagClick?.(part.value)}
                      className="text-blue-300 hover:text-blue-200 font-semibold transition-colors"
                    >
                      {part.content}
                    </button>
                  );
                } else if (part.type === 'mention') {
                  return (
                    <button
                      key={index}
                      onClick={() => onMentionClick?.(part.value)}
                      className="text-blue-300 hover:text-blue-200 font-semibold transition-colors"
                    >
                      {part.content}
                    </button>
                  );
                } else {
                  return <span key={index}>{part.content}</span>;
                }
              })}
            </div>
            
            {shouldShowMore && !isExpanded && (
              <button
                onClick={() => setIsExpanded(true)}
                className="text-white/70 hover:text-white text-sm mt-1 transition-colors"
              >
                more
              </button>
            )}
          </div>
        )}

        {/* Challenges/Hashtags */}
        {video.challenges && video.challenges.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {video.challenges.map((challenge) => (
              <button
                key={challenge.id}
                onClick={() => onHashtagClick?.(challenge.title)}
                className="bg-black/20 backdrop-blur-sm rounded-full px-3 py-1 text-xs text-white hover:bg-black/40 transition-colors"
              >
                #{challenge.title}
              </button>
            ))}
          </div>
        )}

        {/* Effects and Music Info */}
        <div className="flex items-center space-x-3 text-white/80 text-xs">
          
          {/* Effect Stickers */}
          {video.effectStickers && video.effectStickers.length > 0 && (
            <div className="flex items-center space-x-1 bg-black/20 backdrop-blur-sm rounded-full px-2 py-1">
              <img 
                src={video.effectStickers[0].iconUrl} 
                alt="Effect"
                className="w-4 h-4 rounded"
              />
              <span>{video.effectStickers[0].name}</span>
            </div>
          )}

          {/* Music Info */}
          {video.music && (
            <div className="flex items-center space-x-1 bg-black/20 backdrop-blur-sm rounded-full px-2 py-1 max-w-xs">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
              </svg>
              <span className="truncate">
                {video.music.title} - {video.music.authorName}
              </span>
            </div>
          )}
        </div>

        {/* Video Duration Badge */}
        {video.video.duration && (
          <div className="inline-flex items-center space-x-1 bg-black/40 backdrop-blur-sm rounded px-2 py-1 text-xs text-white">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>
              <path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
            </svg>
            <span>{Math.floor(video.video.duration)}s</span>
          </div>
        )}
      </div>
    </div>
  );
};
