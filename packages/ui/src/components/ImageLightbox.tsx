import React, { useState, useEffect, useRef, useMemo, Suspense, lazy } from 'react';
import { createPortal } from 'react-dom';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { DEFAULT_QUICK_ACTIONS } from "@/constants";

import { ImageLightboxEditorConfig } from './ImageLightboxTypes';
const ImageLightboxPrompt = lazy(() => import('./ImageLightboxPrompt').then(m => ({ default: m.ImageLightboxPrompt })));
const PublishDialog = lazy(() => import('@/components/PublishDialog'));
interface ImageLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  imageTitle: string;
  originalImageId?: string;
  onPublish?: (option: 'overwrite' | 'new' | 'version', imageUrl: string, title: string, description?: string, parentId?: string, collectionIds?: string[]) => void;
  showPrompt?: boolean;
  generatedImageUrl?: string;
  // Navigation props
  currentIndex?: number;
  totalCount?: number;
  onNavigate?: (direction: 'prev' | 'next') => void;
  onPreload?: (direction: 'prev' | 'next') => void;
  // Editor Config
  editorConfig?: ImageLightboxEditorConfig;
  // Wizard navigation
  onOpenInWizard?: () => void; // Open current image in full wizard
  inline?: boolean;
}

import ResponsiveImage from './ResponsiveImage';

export default function ImageLightbox({
  isOpen,
  onClose,
  imageUrl,
  imageTitle,
  originalImageId,
  onPublish,
  showPrompt = true,
  generatedImageUrl,
  currentIndex,
  totalCount,
  onNavigate,
  editorConfig,
  onOpenInWizard,
  inline = false
}: ImageLightboxProps) {
  const [lightboxLoaded, setLightboxLoaded] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [scale, setScale] = useState(1);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [showPromptField, setShowPromptField] = useState(false);
  const [showInfoPopup, setShowInfoPopup] = useState(false);
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const swipeStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const isSwipingRef = useRef(false);
  const isPanningRef = useRef(false);

  // Detect mobile for disabling zoom
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches
  );
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Extract values that ImageLightbox needs directly from editorConfig
  const {
    onNavigateHistory,
  } = editorConfig || {};

  // Preload image when lightbox opens
  useEffect(() => {
    if (isOpen || inline) {
      // Ensure prompt field is hidden by default when opening
      setShowPromptField(false);
    }
  }, [isOpen, inline]);

  // Handle keyboard events
  useEffect(() => {
    if (!isOpen && !inline) return;

    const handleKeyDown = (event: KeyboardEvent) => {

      // Check if user is typing in the textarea or any input field
      const target = event.target as HTMLElement;
      const isTypingInInput = target instanceof HTMLTextAreaElement ||
        target instanceof HTMLInputElement ||
        target?.contentEditable === 'true' ||
        target?.tagName === 'TEXTAREA' ||
        target?.tagName === 'INPUT';


      if (event.key === 'Escape') {
        if (isTypingInInput) {
          // If typing in input, ESC should hide prompt and clear text (handled in textarea onKeyDown)
          return;
        }
        onClose();
      } else if (event.key === 'ArrowUp' && event.ctrlKey && onNavigateHistory) {
        // Ctrl+ArrowUp for prompt history navigation
        event.preventDefault();
        onNavigateHistory('up');
      } else if (event.key === 'ArrowDown' && event.ctrlKey && onNavigateHistory) {
        // Ctrl+ArrowDown for prompt history navigation
        event.preventDefault();
        onNavigateHistory('down');
      } else if (event.key === 'ArrowLeft' && !isTypingInInput && onNavigate) {
        event.preventDefault();
        onNavigate('prev');
      } else if (event.key === 'ArrowRight' && !isTypingInInput && onNavigate) {
        event.preventDefault();
        onNavigate('next');
      } else if (event.key === ' ' && !isTypingInInput && showPrompt) {
        // Spacebar to toggle prompt field (only when not typing)
        event.preventDefault();
        setShowPromptField(!showPromptField);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onNavigate, currentIndex, totalCount, showPrompt, showPromptField, onNavigateHistory]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
      }
    };
  }, []);

  // Swipe detection functions
  const handleSwipeStart = (clientX: number, clientY: number) => {
    swipeStartRef.current = { x: clientX, y: clientY, time: Date.now() };
    isSwipingRef.current = false;
  };

  const handleSwipeEnd = (clientX: number, clientY: number) => {
    if (!swipeStartRef.current || !onNavigate) {
      return;
    }

    const deltaX = clientX - swipeStartRef.current.x;
    const deltaY = clientY - swipeStartRef.current.y;
    const deltaTime = Date.now() - swipeStartRef.current.time;

    // Swipe thresholds
    const minSwipeDistance = 50; // Minimum distance for a swipe
    const maxSwipeTime = 500; // Maximum time for a swipe (ms)
    const maxVerticalDistance = 100; // Maximum vertical movement for horizontal swipe

    // Check if this is a valid horizontal swipe
    if (
      Math.abs(deltaX) > minSwipeDistance &&
      Math.abs(deltaY) < maxVerticalDistance &&
      deltaTime < maxSwipeTime &&
      !isPanning // Don't trigger swipe if user was panning/zooming
    ) {
      if (deltaX > 0) {
        // Swipe right = previous image
        onNavigate('prev');
      } else if (deltaX < 0) {
        // Swipe left = next image  
        onNavigate('next');
      }
    }

    swipeStartRef.current = null;
    isSwipingRef.current = false;
  };

  const handlePublishClick = () => {
    setShowPublishDialog(true);
  };

  const handlePublish = (option: 'overwrite' | 'new' | 'version', title: string, description?: string, parentId?: string, collectionIds?: string[]) => {
    if (onPublish) {
      const urlToPublish = generatedImageUrl || imageUrl;
      onPublish(option, urlToPublish, title, description, parentId, collectionIds);
    }
    setShowPublishDialog(false);
  };

  // Provide the publish click handler internally to editorConfig if missing
  const activeEditorConfig = React.useMemo(() => {
    if (!editorConfig) return undefined;
    return {
      ...editorConfig,
      onPublishClick: editorConfig.onPublishClick || handlePublishClick,
      onOpenInWizard: editorConfig.onOpenInWizard || onOpenInWizard,
      quickActions: editorConfig.quickActions || DEFAULT_QUICK_ACTIONS
    };
  }, [editorConfig, onOpenInWizard]);

  // Determine if it's a video
  const isVideo = useMemo(() => {
    const url = (generatedImageUrl || imageUrl || '').toLowerCase();
    const title = (imageTitle || '').toLowerCase();
    return url.match(/\.(mp4|webm|ogg|mov)$/) || title.match(/\.(mp4|webm|ogg|mov)$/);
  }, [generatedImageUrl, imageUrl, imageTitle]);

  if (!isOpen && !inline) return null;

  const mediaEl = isVideo ? (
    <video
      src={generatedImageUrl || imageUrl}
      controls
      autoPlay
      loop
      className={`object-contain pointer-events-auto ${inline ? 'max-w-full max-h-full' : 'max-w-[100vw] max-h-[100dvh] md:max-w-[90vw] md:max-h-[90vh]'}`}
      onClick={(e) => {
        // Only trigger navigation if they click outside the actual video controls region
        // but it's hard to distinguish. Typically preventing propagation is safer, 
        // but we'll leave standard behavior of next image on video click unless hitting controls.
      }}
      onLoadedData={() => setLightboxLoaded(true)}
      onTouchStart={(e: React.TouchEvent) => {
        const touch = e.touches[0];
        handleSwipeStart(touch.clientX, touch.clientY);
      }}
      onTouchEnd={(e: React.TouchEvent) => {
        const touch = e.changedTouches[0];
        handleSwipeEnd(touch.clientX, touch.clientY);
      }}
    />
  ) : (
    <ResponsiveImage
      src={generatedImageUrl || imageUrl}
      alt={imageTitle}
      sizes={`${Math.ceil(scale * 100)}vw`}
      responsiveSizes={[800]}
      imgClassName={`object-contain pointer-events-auto ${inline ? 'max-w-full max-h-full' : 'max-w-[100vw] max-h-[100dvh] md:max-w-[90vw] md:max-h-[90vh] md:cursor-grab md:active:cursor-grabbing'}`}
      className="flex items-center justify-center"
      loading="eager"
      draggable={false}
      onLoad={() => setLightboxLoaded(true)}
      onClick={(e: React.MouseEvent) => {
        // Click on image = next image
        if (!isPanningRef.current && onNavigate && !inline) {
          e.stopPropagation();
          onNavigate('next');
        }
      }}
      onTouchStart={(e: React.TouchEvent) => {
        const touch = e.touches[0];
        handleSwipeStart(touch.clientX, touch.clientY);
      }}
      onTouchEnd={(e: React.TouchEvent) => {
        const touch = e.changedTouches[0];
        handleSwipeEnd(touch.clientX, touch.clientY);
      }}
    />
  );

  const innerContent = (
    <div
      className="relative w-full h-full flex items-center justify-center min-w-0 min-h-0 overflow-hidden"
      onClick={(e) => {
        // Close when clicking the dark area outside the image
        if (e.target === e.currentTarget && !inline) {
          onClose();
        }
      }}
    >
      <div
        className="relative w-full h-full flex items-center justify-center min-w-0 min-h-0"
        onClick={(e) => {
          if (e.target === e.currentTarget && !inline) {
            onClose();
          }
        }}
      >
        {isMobile ? mediaEl : (
          <div
            onClick={(e) => {
              // Navigate to next image on click, but only at scale=1 (not zoomed)
              if (!isVideo && scale <= 1 && !isPanningRef.current && onNavigate) {
                e.stopPropagation();
                onNavigate('next');
              }
            }}
            style={{ cursor: scale <= 1 ? 'pointer' : 'grab' }}
          >
            <TransformWrapper
              initialScale={1}
              minScale={1}
              maxScale={40}
              centerOnInit={true}
              centerZoomedOut={true}
              limitToBounds={true}
              disabled={!!isVideo}

              alignmentAnimation={{ animationTime: 200, animationType: 'easeOut' }}
              wheel={{ step: 1 }}
              doubleClick={{ disabled: false, step: 0.7 }}
              pinch={{ step: 20 }}
              onTransformed={(e) => setScale(e.state.scale)}
            >
              <TransformComponent
                wrapperClass="w-full h-full"
                contentClass=""
              >
                {mediaEl}
              </TransformComponent>
            </TransformWrapper>
          </div>
        )}
      </div>
      {!lightboxLoaded && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
        </div>
      )}

      {/* Close Button */}
      {!inline && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="absolute top-4 right-4 text-white text-2xl p-4 bg-black/75 rounded-lg hover:bg-black/90 transition-all duration-200 z-20"
          title="Close (ESC)"
        >
          ×
        </button>
      )}

      {/* Navigation Buttons - show if navigation function exists and we have valid navigation data */}
      {onNavigate && currentIndex !== undefined && totalCount !== undefined && totalCount > 1 && !inline && (
        <>
          {currentIndex > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNavigate('prev');
              }}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 text-white text-xl bg-black/75 rounded-lg hover:bg-black/90 transition-all duration-200"
              style={{ zIndex: 50 }}
              title="Previous (←)"
            >
              ‹
            </button>
          )}

          {currentIndex < totalCount - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNavigate('next');
              }}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 text-white text-xl bg-black/75 rounded-lg hover:bg-black/90 transition-all duration-200"
              style={{ zIndex: 50 }}
              title="Next (→)"
            >
              ›
            </button>
          )}
        </>
      )}

      {/* the prompt UI wrapper includes the wand button, the editing toolbar, and info popup */}
      <Suspense fallback={null}>
        <ImageLightboxPrompt
          config={activeEditorConfig}
          showPrompt={!!showPrompt}
          showPromptField={showPromptField}
          setShowPromptField={setShowPromptField}
          lightboxLoaded={lightboxLoaded}

          showInfoPopup={showInfoPopup}
          setShowInfoPopup={setShowInfoPopup}
          imageTitle={imageTitle}
          currentIndex={currentIndex}
          totalCount={totalCount}
          onNavigate={onNavigate}
        />
      </Suspense>
    </div >
  );

  if (inline) {
    return (
      <>
        {innerContent}
        <PublishDialog
          isOpen={showPublishDialog}
          onClose={() => setShowPublishDialog(false)}
          onPublish={handlePublish}
          originalTitle={imageTitle}
          originalImageId={originalImageId}
          isPublishing={editorConfig?.isPublishing}
        />
      </>
    );
  }

  return createPortal(
    <div
      className="fixed inset-0 bg-black/95 z-[9999] flex items-center justify-center"
      onClick={(e) => {
        // Only close if clicking on the main background (not on image area)
        if (e.target === e.currentTarget) {
          if (showPrompt) {
            setShowPromptField(!showPromptField);
          } else {
            onClose();
          }
        }
      }}
      onTouchStart={(e) => {
        // Only handle swipe on the main container, not on child elements
        if (e.target === e.currentTarget) {
          const touch = e.touches[0];
          handleSwipeStart(touch.clientX, touch.clientY);
        }
      }}
      onTouchEnd={(e) => {
        // Only handle swipe on the main container, not on child elements
        if (e.target === e.currentTarget) {
          const touch = e.changedTouches[0];
          handleSwipeEnd(touch.clientX, touch.clientY);
        }
      }}
    >
      {innerContent}
      <PublishDialog
        isOpen={showPublishDialog}
        onClose={() => setShowPublishDialog(false)}
        onPublish={handlePublish}
        originalTitle={imageTitle}
        originalImageId={originalImageId}
        isPublishing={editorConfig?.isPublishing}
      />
    </div>,
    document.body
  );
}
