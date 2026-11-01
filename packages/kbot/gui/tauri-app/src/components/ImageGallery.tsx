import { useState, useEffect, useRef } from 'react';
import { ImageFile } from '../types';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { ArrowUp } from 'lucide-react';

interface ImageGalleryProps {
  images: ImageFile[];
  onImageSelection?: (imagePath: string, isMultiSelect: boolean) => void;
  onImageRemove?: (imagePath: string) => void;
  onImageDelete?: (imagePath: string) => void;
  onImageSaveAs?: (imagePath: string) => void;
  showSelection?: boolean;
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
  onDoubleClick?: (imagePath: string) => void;
  onLightboxPromptSubmit?: (prompt: string, imagePath: string) => void;
  promptHistory?: string[];
  historyIndex?: number;
  navigateHistory?: (direction: 'up' | 'down') => void;
  isGenerating?: boolean;
  errorMessage?: string | null;
  setErrorMessage?: (message: string | null) => void;
}

export default function ImageGallery({ 
  images, 
  onImageSelection, 
  onImageRemove, 
  onImageDelete,
  onImageSaveAs,
  showSelection = false,
  currentIndex,
  setCurrentIndex,
  onDoubleClick,
  onLightboxPromptSubmit,
  promptHistory = [],
  historyIndex = -1,
  navigateHistory,
  isGenerating = false,
  errorMessage,
  setErrorMessage
}: ImageGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxLoaded, setLightboxLoaded] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [lightboxPrompt, setLightboxPrompt] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [skipDeleteConfirm, setSkipDeleteConfirm] = useState(false);
  const [rememberChoice, setRememberChoice] = useState(false);
  const panStartRef = useRef<{ x: number; y: number } | null>(null);

  // Sync lightbox prompt with history navigation
  useEffect(() => {
    if (lightboxOpen && historyIndex >= 0 && historyIndex < promptHistory.length) {
      setLightboxPrompt(promptHistory[historyIndex]);
    }
  }, [historyIndex, promptHistory, lightboxOpen]);

  // Handle keyboard events for lightbox
  useEffect(() => {
    if (!lightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' && !isGenerating && onImageDelete) {
        e.preventDefault();
        const safeIndex = Math.max(0, Math.min(currentIndex, images.length - 1));
        if (images[safeIndex]) {
          handleDeleteImage(images[safeIndex].path);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, currentIndex, images, isGenerating, onImageDelete]);

  const handleDeleteImage = (imagePath: string) => {
    if (skipDeleteConfirm) {
      // Skip confirmation and delete immediately
      onImageDelete?.(imagePath);
      // Close lightbox if this was the last image or adjust index
      if (images.length <= 1) {
        setLightboxOpen(false);
      } else {
        // Adjust current index if needed
        const deletingIndex = images.findIndex(img => img.path === imagePath);
        if (deletingIndex === currentIndex && currentIndex >= images.length - 1) {
          setCurrentIndex(Math.max(0, currentIndex - 1));
        }
      }
    } else {
      // Show confirmation dialog
      setShowDeleteConfirm(true);
    }
  };

  const confirmDelete = (remember: boolean) => {
    const safeIndex = Math.max(0, Math.min(currentIndex, images.length - 1));
    if (images[safeIndex]) {
      if (remember) {
        setSkipDeleteConfirm(true);
      }
      onImageDelete?.(images[safeIndex].path);
      
      // Close lightbox if this was the last image or adjust index
      if (images.length <= 1) {
        setLightboxOpen(false);
      } else {
        // Adjust current index if needed
        if (currentIndex >= images.length - 1) {
          setCurrentIndex(Math.max(0, currentIndex - 1));
        }
      }
    }
    setShowDeleteConfirm(false);
  };

  // Reset current index if images change, preventing out-of-bounds errors
  useEffect(() => {
    if (images.length > 0 && currentIndex >= images.length) {
      setCurrentIndex(Math.max(0, images.length - 1));
    }
  }, [images.length, currentIndex, setCurrentIndex]);

  // ESC key handler for lightbox
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!lightboxOpen) return;
      
      if (event.key === 'Escape') {
        setLightboxOpen(false);
      } else if (event.key === 'ArrowRight' && currentIndex < images.length - 1) {
        const newIndex = currentIndex + 1;
        setCurrentIndex(newIndex);
        preloadImage(newIndex);
      } else if (event.key === 'ArrowLeft' && currentIndex > 0) {
        const newIndex = currentIndex - 1;
        setCurrentIndex(newIndex);
        preloadImage(newIndex);
      }
    };

    if (lightboxOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [lightboxOpen, currentIndex, images.length, setCurrentIndex]);

  const preloadImage = (index: number) => {
    if (images.length === 0 || index < 0 || index >= images.length) return;
    
    setLightboxLoaded(false);
    const img = new Image();
    img.src = images[index].src;
    img.onload = () => {
      setLightboxLoaded(true);
    };
    img.onerror = () => {
      setLightboxLoaded(true); // Show even if failed to load
    };
  };

  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
    preloadImage(index);
  };

  const handleThumbnailClick = (event: React.MouseEvent<HTMLButtonElement>, imagePath: string, index: number) => {
    const isMultiSelect = event.ctrlKey || event.metaKey;

    if (showSelection && onImageSelection) {
      onImageSelection(imagePath, isMultiSelect);
    }

    if (!isMultiSelect) {
      setCurrentIndex(index);
    }
  };

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="w-64 h-64 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center">
          <div className="text-slate-500 dark:text-slate-400">
            <svg className="w-16 h-16 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
            <p className="text-lg font-medium">No images yet</p>
            <p className="text-sm">Add images to get started</p>
          </div>
        </div>
      </div>
    );
  }

  // Safeguard against rendering with an invalid index after a delete/remove operation
  const safeIndex = Math.max(0, Math.min(currentIndex, images.length - 1));
  const currentImage = images.length > 0 ? images[safeIndex] : null;

  if (!currentImage) {
    // This should theoretically not be reached if the length check above is sound,
    // but it's an extra layer of protection.
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="w-64 h-64 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  const isGenerated = !!currentImage.isGenerated;
  const isSelected = currentImage.selected || false;

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left column: Main Image Display */}
      <div className="lg:col-span-2">
        <div className="flex items-center justify-center rounded-lg">
          <div className="relative w-full h-[300px] flex items-center justify-center">
            <img 
              src={currentImage.src}
              alt={currentImage.path}
              className={`max-h-[300px] max-w-full object-contain rounded-lg shadow-lg border-2 transition-all duration-300 cursor-pointer ${
                isSelected 
                  ? 'border-blue-400 shadow-blue-400/30' 
                  : isGenerated 
                    ? 'border-green-300' 
                    : 'border-white/30'
              }`}
              onDoubleClick={() => openLightbox(safeIndex)}
              title="Double-click for fullscreen"
            />
            <div className="absolute top-2 left-2 flex flex-col gap-2">
            {/* Compact overlays */}
            {isGenerated && isSelected && (
              <div className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-semibold shadow-lg flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                ✓
              </div>
            )}
            
            {isGenerated && !isSelected && (
              <div className="bg-green-500 text-white px-2 py-1 rounded text-xs font-semibold shadow-lg">
                ✨
              </div>
            )}
            </div>
          </div>
        </div>

        {/* Image Info */}
        <div className="text-center mt-3">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {currentImage.path.split(/[/\\]/).pop()} • {safeIndex + 1}/{images.length}
          </p>
        </div>
      </div>

      {/* Right column: Thumbnails */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Images ({images.length})</h4>
        <div className="grid grid-cols-2 gap-2">
          {images.map((image, index) => {
            const thumbIsGenerating = image.path.startsWith('generating_');
            const thumbIsGenerated = !!image.isGenerated;
            const thumbIsSelected = image.selected || false;
            
            return (
              <button
                type="button"
                key={image.path}
                onClick={(e) => handleThumbnailClick(e, image.path, index)}
                onDoubleClick={() => {
                  if (onDoubleClick) {
                    onDoubleClick(image.path);
                  } else {
                    openLightbox(index);
                  }
                }}
                className={`group relative aspect-square rounded-lg overflow-hidden transition-all duration-300 border-2 ${
                  currentIndex === index 
                    ? 'ring-2 ring-orange-500 border-orange-500' 
                    : thumbIsSelected 
                      ? 'border-blue-400 ring-2 ring-blue-300' 
                      : thumbIsGenerated 
                        ? 'border-green-300 hover:border-blue-300' 
                        : 'border-slate-300 hover:border-slate-400'
                }`}
                title={
                  thumbIsGenerated 
                    ? "Generated image - click to select/view" 
                    : "Click to view"
                }
              >
                <img
                  src={image.src}
                  alt={image.path}
                  className="w-full h-full object-cover"
                />
                
                {/* Selection indicator */}
                {thumbIsGenerated && thumbIsSelected && (
                  <div className="absolute top-1 left-1 bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                
                {/* Generated indicator */}
                {thumbIsGenerated && !thumbIsSelected && (
                  <div className="absolute top-1 left-1 bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                    ✨
                  </div>
                )}
                
                {/* Save button */}
                {!thumbIsGenerating && onImageSaveAs && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onImageSaveAs(image.path);
                    }}
                    className="absolute bottom-1 left-1 bg-blue-600/70 hover:bg-blue-700 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs transition-all duration-200"
                    title="Save Image As..."
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M5 2a1 1 0 00-1 1v14a1 1 0 001 1h10a1 1 0 001-1V7.414a1 1 0 00-.293-.707l-4-4A1 1 0 0011.586 2H5zm5 2a2 2 0 11-4 0 2 2 0 014 0zm-2 9a1 1 0 00-1 1v1a1 1 0 102 0v-1a1 1 0 00-1-1z" />
                    </svg>
                  </button>
                )}

                {/* Delete Button */}
                {!thumbIsGenerating && onImageDelete && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('Are you sure you want to permanently delete this file? This action cannot be undone.')) {
                        onImageDelete(image.path);
                      }
                    }}
                    className="absolute bottom-1 right-1 bg-red-600/80 hover:bg-red-700 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs transition-all duration-200"
                    title="Delete File Permanently"
                  >
                    ×
                  </button>
                )}
              </button>
            );
          })}
        </div>
      </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div 
          className="fixed inset-0 bg-black/95 z-[9999] flex items-center justify-center"
          onMouseDown={(e) => {
            panStartRef.current = { x: e.clientX, y: e.clientY };
            setIsPanning(false);
          }}
          onMouseMove={(e) => {
            if (panStartRef.current) {
              const distance = Math.sqrt(
                Math.pow(e.clientX - panStartRef.current.x, 2) + 
                Math.pow(e.clientY - panStartRef.current.y, 2)
              );
              if (distance > 5) { // 5px threshold for pan detection
                setIsPanning(true);
              }
            }
          }}
          onMouseUp={() => {
            panStartRef.current = null;
          }}
          onClick={(e) => {
            // Only close if not panning and clicking on background
            if (!isPanning && e.target === e.currentTarget) {
              setLightboxOpen(false);
            }
            setIsPanning(false);
          }}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            {lightboxLoaded ? (
              <TransformWrapper
                initialScale={1}
                minScale={0.1}
                maxScale={10}
                centerOnInit={true}
                wheel={{ step: 0.1 }}
                doubleClick={{ disabled: false, step: 0.7 }}
                pinch={{ step: 5 }}
              >
                <TransformComponent
                  wrapperClass="w-full h-full flex items-center justify-center"
                  contentClass="max-w-full max-h-full"
                >
                  <img
                    src={images[safeIndex].src}
                    alt={images[safeIndex].path}
                    className="max-w-full max-h-full object-contain cursor-grab active:cursor-grabbing"
                    onClick={(e) => e.stopPropagation()}
                    draggable={false}
                  />
                </TransformComponent>
              </TransformWrapper>
            ) : (
              <div className="flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
              </div>
            )}
            
            {/* Close Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightboxOpen(false);
              }}
              className="absolute top-4 right-4 text-white text-2xl p-4 bg-black/75 rounded-lg hover:bg-black/90 transition-all duration-200"
              title="Close (ESC)"
            >
              ×
            </button>
            
            {/* Navigation Buttons */}
            {safeIndex > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(safeIndex - 1);
                  setLightboxLoaded(false);
                  const img = new Image();
                  img.src = images[safeIndex - 1].src;
                  img.onload = () => setLightboxLoaded(true);
                }}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 p-4 text-white text-3xl bg-black/75 rounded-lg hover:bg-black/90 transition-all duration-200"
                title="Previous (←)"
              >
                ‹
              </button>
            )}
            
            {safeIndex < images.length - 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(safeIndex + 1);
                  setLightboxLoaded(false);
                  const img = new Image();
                  img.src = images[safeIndex + 1].src;
                  img.onload = () => setLightboxLoaded(true);
                }}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 p-4 text-white text-3xl bg-black/75 rounded-lg hover:bg-black/90 transition-all duration-200"
                title="Next (→)"
              >
                ›
              </button>
            )}
            
            {/* Lightbox Error Message */}
            {lightboxLoaded && errorMessage && (
              <div className="absolute bottom-40 left-1/2 transform -translate-x-1/2 w-[80vw] max-w-4xl z-[60]">
                <div className="bg-red-900/95 backdrop-blur-sm rounded-xl p-4 shadow-2xl border border-red-500/50 ring-2 ring-red-500/30">
                  <div className="flex justify-between items-start">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-200">
                          Generation Error
                        </h3>
                        <div className="mt-2 text-sm text-red-100">
                          <p>{errorMessage}</p>
                        </div>
                      </div>
                    </div>
                    {setErrorMessage && (
                      <div className="ml-auto pl-3">
                        <button
                          type="button"
                          className="inline-flex bg-red-900/50 rounded-md p-1.5 text-red-400 hover:bg-red-800/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          onClick={() => setErrorMessage(null)}
                        >
                          <span className="sr-only">Dismiss</span>
                          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Lightbox Prompt Field */}
            {lightboxLoaded && onLightboxPromptSubmit && (
              <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 w-[80vw] max-w-4xl z-40">
                <div className="bg-black/80 backdrop-blur-sm rounded-xl p-4 shadow-2xl border border-white/20">
                  <div className="flex gap-3">
                    <div className="flex-1 relative">
                      <textarea
                        value={lightboxPrompt}
                        onChange={(e) => setLightboxPrompt(e.target.value)}
                        placeholder="Quick edit prompt..."
                        disabled={isGenerating}
                        rows={2}
                        className="w-full bg-white/10 border border-white/30 rounded-lg px-3 py-2 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm disabled:opacity-50 resize-none"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey && lightboxPrompt.trim() && !isGenerating) {
                            e.stopPropagation();
                            if (e.ctrlKey) {
                              // Ctrl+Enter: Submit and keep prompt for iteration
                              e.preventDefault();
                              setErrorMessage?.(null); // Clear error message
                              onLightboxPromptSubmit(lightboxPrompt, images[safeIndex].path);
                            } else {
                              // Enter: Submit and clear prompt
                              e.preventDefault();
                              setErrorMessage?.(null); // Clear error message
                              onLightboxPromptSubmit(lightboxPrompt, images[safeIndex].path);
                              setLightboxPrompt('');
                            }
                          } else if (e.key === 'Escape') {
                            e.stopPropagation();
                            e.preventDefault();
                            setLightboxPrompt('');
                          } else if (e.ctrlKey && e.key === 'ArrowUp' && navigateHistory) {
                            e.stopPropagation();
                            e.preventDefault();
                            navigateHistory('up');
                          } else if (e.ctrlKey && e.key === 'ArrowDown' && navigateHistory) {
                            e.stopPropagation();
                            e.preventDefault();
                            navigateHistory('down');
                          } else if (e.key.startsWith('Arrow')) {
                            // Stop all arrow key propagation when textarea is focused (except the Ctrl+ variants above)
                            e.stopPropagation();
                          } else if (e.key === 'Delete' || e.key === 'Backspace') {
                            // Stop Delete and Backspace propagation when textarea is focused
                            // Users should be able to delete text normally without triggering image deletion
                            e.stopPropagation();
                          }
                          // Shift+Enter: Allow new line (default textarea behavior)
                          // All other keys: Normal textarea behavior without interference
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      {/* History navigation buttons */}
                      {promptHistory.length > 0 && (
                        <div className="absolute right-2 top-2 flex gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigateHistory?.('up');
                            }}
                            disabled={isGenerating || historyIndex <= 0}
                            className="p-1 text-white/60 hover:text-white disabled:opacity-30 transition-colors"
                            title={`Previous prompt (${historyIndex + 1}/${promptHistory.length}) - Ctrl+↑`}
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigateHistory?.('down');
                            }}
                            disabled={isGenerating}
                            className="p-1 text-white/60 hover:text-white disabled:opacity-30 transition-colors"
                            title={`Next prompt - Ctrl+↓`}
                          >
                            ↓
                          </button>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (lightboxPrompt.trim() && !isGenerating) {
                          setErrorMessage?.(null); // Clear error message
                          onLightboxPromptSubmit(lightboxPrompt, images[safeIndex].path);
                          setLightboxPrompt('');
                          // Keep lightbox open to show generation progress
                        }
                      }}
                      disabled={!lightboxPrompt.trim() || isGenerating}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white p-2 rounded-lg transition-colors duration-200 disabled:opacity-50 flex items-center justify-center group relative self-start"
                      title="Generate (Enter to clear, Ctrl+Enter to keep)"
                    >
                      {isGenerating ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      ) : (
                        <ArrowUp size={16} />
                      )}
                      {/* Hover tooltip */}
                      <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                        Generate
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Info */}
            {lightboxLoaded && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/75 text-white px-4 py-2 rounded-lg text-sm">
                {isGenerating ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                    Generating edit... • ESC to close
                  </div>
                ) : (
                  `${images[safeIndex].path.split(/[/\\]/).pop()} • ${safeIndex + 1} of ${images.length} • Enter: generate & clear • Ctrl+Enter: generate & keep • Del: delete • ESC to close`
                )}
              </div>
            )}

            {/* Delete Confirmation Dialog */}
            {showDeleteConfirm && (
              <div 
                className="absolute inset-0 bg-black/90 flex items-center justify-center z-50"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.stopPropagation();
                    e.preventDefault();
                    confirmDelete(rememberChoice);
                    setRememberChoice(false);
                  } else if (e.key === 'Escape') {
                    e.stopPropagation();
                    e.preventDefault();
                    setShowDeleteConfirm(false);
                    setRememberChoice(false);
                  }
                }}
                tabIndex={0}
                autoFocus
              >
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md mx-4 shadow-2xl">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Delete Image?
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-2">
                    Are you sure you want to delete "{images[Math.max(0, Math.min(currentIndex, images.length - 1))]?.path.split(/[/\\]/).pop()}"?
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Press <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">Enter</kbd> to confirm or <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">Escape</kbd> to cancel
                  </p>
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={rememberChoice}
                        onChange={(e) => setRememberChoice(e.target.checked)}
                      />
                      Remember for this session (skip confirmation)
                    </label>
                    <div className="flex gap-3 justify-end">
                      <button
                        onClick={() => {
                          setShowDeleteConfirm(false);
                          setRememberChoice(false);
                        }}
                        className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          confirmDelete(rememberChoice);
                          setRememberChoice(false);
                        }}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
