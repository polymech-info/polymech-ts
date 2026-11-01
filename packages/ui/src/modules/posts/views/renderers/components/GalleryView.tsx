import React from "react";
import { PostMediaItem } from "../../types";
import { CompactFilmStrip } from "./CompactFilmStrip";
import { CompactMediaViewer } from "./CompactMediaViewer";
import { isVideoType, normalizeMediaType, detectMediaType } from "@/lib/mediaRegistry";
import type { GalleryProps } from "./GalleryTypes";

const GalleryView: React.FC<GalleryProps> = ({
    mediaItems,
    selectedItem,
    onMediaSelect,
    onExpand,
    isOwner,
    cacheBustKeys = {},
    navigationData,
    handleNavigate = () => { },
    navigate = () => { },
    videoPlaybackUrl,
    videoPosterUrl,
    showDesktopLayout = true,
    thumbnailLayout = 'strip',
    imageFit = 'contain',
    thumbnailsPosition = 'bottom',
    thumbnailsOrientation = 'horizontal',
    zoomEnabled = false,
    showTitle = false,
    showDescription = false,
    thumbnailsClassName = '',
    autoPlayVideos = false,
    className = ""
}) => {
    const currentImageIndex = mediaItems.findIndex(item => item.id === selectedItem.id);
    const [zoomActivated, setZoomActivated] = React.useState(false);

    const handleThumbnailClick = (item: PostMediaItem) => {
        setZoomActivated(true);
        onMediaSelect(item);
    };

    const effectiveType = selectedItem.mediaType || (selectedItem as any).type || detectMediaType(selectedItem.image_url);
    const isVideo = isVideoType(normalizeMediaType(effectiveType));

    const effectiveVideoPlaybackUrl = videoPlaybackUrl || (isVideo ? selectedItem.image_url : undefined);
    const effectiveVideoPosterUrl = videoPosterUrl || (isVideo ? selectedItem.thumbnail_url : undefined);

    const getFlexDirection = () => {
        switch (thumbnailsPosition) {
            case 'top': return 'flex-col-reverse';
            case 'left': return 'flex-row-reverse';
            case 'right': return 'flex-row';
            case 'bottom':
            default: return 'flex-col';
        }
    };

    const isSidebar = thumbnailsPosition === 'left' || thumbnailsPosition === 'right';
    const hasCaption = (showTitle && selectedItem.title) || (showDescription && selectedItem.description);

    return (
        <div className={`flex ${getFlexDirection()} h-full ${className} dark:bg-slate-900/10`}>
            {/* Main Media Viewer + Caption overlay */}
            <div className={`flex-1 relative min-0 ${isSidebar ? 'h-full' : 'w-full'}`}>
                <CompactMediaViewer
                    mediaItem={selectedItem}
                    isVideo={isVideo}
                    showDesktopLayout={showDesktopLayout}
                    mediaItems={mediaItems}
                    currentImageIndex={currentImageIndex}
                    navigationData={navigationData}
                    handleNavigate={handleNavigate}
                    onMediaSelect={onMediaSelect}
                    onExpand={onExpand}
                    cacheBustKeys={cacheBustKeys}
                    navigate={navigate}
                    isOwner={isOwner}
                    videoPlaybackUrl={effectiveVideoPlaybackUrl}
                    videoPosterUrl={effectiveVideoPosterUrl}
                    imageFit={imageFit}
                    zoomEnabled={zoomEnabled && zoomActivated}
                    autoPlayVideos={autoPlayVideos}
                />

                {/* Title / Description — overlay at bottom-left of image */}
                {hasCaption && (
                    <div className="absolute bottom-0 left-0 right-0 px-3 py-2 bg-gradient-to-t from-black/60 to-transparent pointer-events-none z-10">
                        <div className="flex flex-col gap-0.5 text-left">
                            {showTitle && selectedItem.title && (
                                <h3 className="text-sm font-semibold text-white leading-snug truncate drop-shadow-sm">
                                    {selectedItem.title}
                                </h3>
                            )}
                            {showDescription && selectedItem.description && (
                                <p className="text-xs text-white/80 leading-relaxed line-clamp-2 drop-shadow-sm">
                                    {selectedItem.description}
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Filmstrip */}
            <div className={`
                flex justify-center 
                ${isSidebar ? 'h-full w-auto' : 'w-full h-auto'}
                ${thumbnailsPosition === 'left' ? '' : ''}
                ${thumbnailsPosition === 'top' ? '' : ''}
                ${thumbnailsPosition === 'bottom' ? '' : ''}
            `}>
                <CompactFilmStrip
                    mediaItems={mediaItems}
                    isEditMode={false}
                    mediaItem={selectedItem}
                    onMediaSelect={handleThumbnailClick}
                    isOwner={isOwner}
                    onDeletePicture={() => {}}
                    onGalleryPickerOpen={() => {}}
                    cacheBustKeys={cacheBustKeys}
                    thumbnailLayout={thumbnailLayout}
                    orientation={thumbnailsOrientation}
                    className={thumbnailsClassName}
                />
            </div>
        </div>
    );
};

export default GalleryView;
