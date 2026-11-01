/**
 * Infinite Scroll Hook
 * Based on deobfuscated TikTok infinite scroll mechanism
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { UseInfiniteScrollReturn, VideoItem } from '../types/index.js';
import { throttle, getElementCenterDistance } from '../utils';

interface UseInfiniteScrollOptions {
  onLoadMore?: () => void;
  hasMore?: boolean;
  threshold?: number;
  preloadDistance?: number;
  onVideoChange?: (index: number) => void;
}

export function useInfiniteScroll(
  videos: VideoItem[],
  options: UseInfiniteScrollOptions = {}
): UseInfiniteScrollReturn {
  const {
    onLoadMore,
    hasMore = true,
    threshold = 0.8,
    preloadDistance = 6,
    onVideoChange
  } = options;

  const [currentIndex, setCurrentIndex] = useState(0);
  const currentIndexRef = useRef(currentIndex);
  currentIndexRef.current = currentIndex;

  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<Map<number, HTMLElement>>(new Map());

  // Register video element ref
  const registerVideoRef = useCallback((index: number, element: HTMLElement | null) => {
    if (element) {
      videoRefs.current.set(index, element);
    } else {
      videoRefs.current.delete(index);
    }
  }, []);

  // Calculate current video based on viewport position
  const calculateCurrentVideo = useCallback(() => {
    if (!containerRef.current || videos.length === 0) return 0;

    let closestIndex = 0;
    let closestDistance = Infinity;

    // Find video closest to viewport center
    videoRefs.current.forEach((element, index) => {
      const distance = getElementCenterDistance(element);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    return closestIndex;
  }, [videos.length]);

  // Throttled scroll handler based on TikTok's implementation
  const handleScroll = useCallback(
    throttle(() => {
      if (!containerRef.current) return;

      const container = containerRef.current;
      const scrollTop = container.scrollTop;
      const containerHeight = container.clientHeight;
      const scrollHeight = container.scrollHeight;

      // Calculate current video index
      const newIndex = calculateCurrentVideo();

      // Update current index if changed
      if (newIndex !== currentIndexRef.current && newIndex >= 0 && newIndex < videos.length) {
        setCurrentIndex(newIndex);
        onVideoChange?.(newIndex);
      }

      // Preload more content when approaching end
      const shouldLoadMore = scrollTop + containerHeight >= scrollHeight * threshold;

      if (shouldLoadMore && hasMore && !isLoading && onLoadMore) {
        setIsLoading(true);
        onLoadMore();
      }

      // Preload next videos when within preloadDistance of current
      if (videos.length - newIndex < preloadDistance && hasMore && !isLoading && onLoadMore) {
        setIsLoading(true);
        onLoadMore();
      }
    }, 100),
    [
      videos.length,
      hasMore,
      isLoading,
      onLoadMore,
      threshold,
      preloadDistance,
      onVideoChange,
      calculateCurrentVideo
    ]
  );

  // Attach scroll event listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Handle loading state reset
  useEffect(() => {
    if (isLoading) {
      // Reset loading state after a delay to prevent rapid firing
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  // Keyboard navigation (arrow keys)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!containerRef.current) return;

      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault();
          if (currentIndex > 0) {
            const prevElement = videoRefs.current.get(currentIndex - 1);
            if (prevElement) {
              prevElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }
          break;
        case 'ArrowDown':
          event.preventDefault();
          if (currentIndex < videos.length - 1) {
            const nextElement = videoRefs.current.get(currentIndex + 1);
            if (nextElement) {
              nextElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }
          break;
        case ' ':
          event.preventDefault();
          // Space bar handling can be implemented by parent component
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, videos.length]);

  // Scroll to specific video
  const scrollToVideo = useCallback((index: number) => {
    if (index < 0 || index >= videos.length) return;

    const element = videoRefs.current.get(index);
    if (element) {
      //  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [videos.length]);

  // Navigate to next video
  const nextVideo = useCallback(() => {
    const nextIndex = Math.min(currentIndex + 1, videos.length - 1);
    scrollToVideo(nextIndex);
  }, [currentIndex, videos.length, scrollToVideo]);

  // Navigate to previous video
  const prevVideo = useCallback(() => {
    const prevIndex = Math.max(currentIndex - 1, 0);
    scrollToVideo(prevIndex);
  }, [currentIndex, scrollToVideo]);

  return {
    containerRef,
    currentIndex,
    isLoading,
    handleScroll,
    registerVideoRef,
    scrollToVideo,
    nextVideo,
    prevVideo
  } as UseInfiniteScrollReturn & {
    registerVideoRef: (index: number, element: HTMLElement | null) => void;
    scrollToVideo: (index: number) => void;
    nextVideo: () => void;
    prevVideo: () => void;
  };
}
