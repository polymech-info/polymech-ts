import React, { } from "react";
import { useNavigate } from "react-router-dom";
import { useOrganization } from "@/contexts/OrganizationContext";
import { PostRendererProps } from '../types';
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { isVideoType, normalizeMediaType, detectMediaType } from "@/lib/mediaRegistry";

// Extracted Components
import { MobileGroupedFeed } from "./components/MobileGroupedFeed";
import { CompactPostHeader } from "./components/CompactPostHeader";
import { CompactMediaDetails } from "./components/CompactMediaDetails";
import { Gallery } from "./components/Gallery";

// Lazy load ImageEditor
const ImageEditor = React.lazy(() => import("@/components/ImageEditor").then(module => ({ default: module.ImageEditor })));

export const CompactRenderer: React.FC<PostRendererProps> = (props) => {
    const {
        post, authorProfile, mediaItems, mediaItem,
        isOwner, isLiked, likesCount,
        onEditPost, onViewModeChange, onExportMarkdown,
        onDeletePost, onDeletePicture, onLike, onEditPicture,
        onMediaSelect, onExpand, onDownload, onCategoryManagerOpen,
        currentImageIndex, videoPlaybackUrl, videoPosterUrl,
        versionImages, handlePrevImage, handleNavigate, navigationData,
        isEditMode, localPost, setLocalPost, localMediaItems, setLocalMediaItems, onMoveItem,
        onEditModeToggle, onSaveChanges, onGalleryPickerOpen
    } = props;

    const [expandedComments, setExpandedComments] = React.useState<Record<string, boolean>>({});
    const [expandedDescriptions, setExpandedDescriptions] = React.useState<Record<string, boolean>>({});
    const [showImageEditor, setShowImageEditor] = React.useState(false);
    const [cacheBustKeys, setCacheBustKeys] = React.useState<Record<string, number>>({});

    const navigate = useNavigate();
    const { orgSlug } = useOrganization();

    const isDesktop = useMediaQuery("(min-width: 1024px)");
    const showDesktopLayout = isDesktop;

    const effectiveType = mediaItem.type || detectMediaType(mediaItem.image_url);
    const isVideo = isVideoType(normalizeMediaType(effectiveType));

    return (
        <div className={cn(props.className || 'h-[inherit]', 'min-h-0 overflow-hidden flex flex-col', props.embedded && 'flex-1')}>
            {/* Mobile Header - Controls and Info at Top */}
            <div className="lg:hidden landscape:hidden py-4 bg-card ">
                <CompactPostHeader
                    isEditMode={!!isEditMode}
                    post={post}
                    localPost={localPost}
                    setLocalPost={setLocalPost!}
                    mediaItem={mediaItem}
                    authorProfile={authorProfile!}
                    isOwner={!!isOwner}
                    embedded={props.embedded}
                    onViewModeChange={onViewModeChange!}
                    onExportMarkdown={onExportMarkdown!}
                    onSaveChanges={onSaveChanges!}
                    onEditModeToggle={onEditModeToggle!}
                    onEditPost={onEditPost!}
                    onDeletePicture={onDeletePicture!}
                    onDeletePost={onDeletePost!}
                    onCategoryManagerOpen={onCategoryManagerOpen}
                    mediaItems={mediaItems}
                    localMediaItems={localMediaItems}
                />
            </div>

            {/* Desktop layout: resizable split; Mobile: single column */}
            <div className="group min-h-0 flex flex-1 flex-col overflow-x-hidden">
                <div className="grid min-h-0 flex-1 grid-cols-1 lg:h-full lg:min-h-0 lg:max-h-full lg:grid-cols-2 lg:grid-rows-1">
                    {/* Left Column - Media */}
                    <div
                        className={cn(
                            isVideo ? 'aspect-video' : 'aspect-square',
                            'relative flex h-full w-full min-h-0 flex-col overflow-hidden border bg-background lg:aspect-auto lg:min-h-0 lg:max-h-full',
                        )}
                    >

                        {/* Desktop Gallery - Combines Media Viewer + Filmstrip */}
                        <div className="hidden lg:block h-full">
                            <Gallery
                                mediaItems={mediaItems}
                                selectedItem={mediaItem}
                                onMediaSelect={onMediaSelect}
                                onExpand={onExpand}
                                isOwner={!!isOwner}
                                isEditMode={!!isEditMode}
                                localMediaItems={localMediaItems}
                                setLocalMediaItems={setLocalMediaItems}
                                onDeletePicture={onDeletePicture!}
                                onGalleryPickerOpen={onGalleryPickerOpen!}
                                cacheBustKeys={cacheBustKeys}
                                navigationData={navigationData}
                                handleNavigate={handleNavigate!}
                                navigate={navigate}
                                videoPlaybackUrl={videoPlaybackUrl}
                                videoPosterUrl={videoPosterUrl}
                                showDesktopLayout={!!showDesktopLayout}
                            />
                        </div>

                        {/* Mobile View - Grouped Feed - Hidden on Desktop */}
                        <MobileGroupedFeed
                            mediaItems={mediaItems}
                            isOwner={!!isOwner}
                            isLiked={!!isLiked}
                            onMediaSelect={onMediaSelect}
                            onLike={onLike}
                            onDeletePicture={onDeletePicture!}
                            onGalleryPickerOpen={onGalleryPickerOpen!}
                            onExpand={onExpand}
                            onEditPicture={onEditPicture!}
                            onDownload={onDownload!}
                            setShowImageEditor={setShowImageEditor}
                            post={post}
                            orgSlug={orgSlug}
                            expandedComments={expandedComments}
                            setExpandedComments={setExpandedComments}
                            expandedDescriptions={expandedDescriptions}
                            setExpandedDescriptions={setExpandedDescriptions}
                            cacheBustKeys={cacheBustKeys}
                        />
                    </div>

                    {/* Right Column - Content (scrolls; post description lives in header) */}
                    <div className="hidden min-h-0 flex-col overflow-y-auto overscroll-y-contain scrollbar-custom lg:flex lg:min-h-0 lg:max-h-full landscape:flex landscape:h-full landscape:overflow-y-auto">
                        <div className="hidden lg:block landscape:block">
                            <CompactPostHeader
                                isEditMode={!!isEditMode}
                                post={post}
                                localPost={localPost}
                                setLocalPost={setLocalPost!}
                                mediaItem={mediaItem}
                                authorProfile={authorProfile!}
                                isOwner={!!isOwner}
                                embedded={props.embedded}
                                onViewModeChange={onViewModeChange!}
                                onExportMarkdown={onExportMarkdown!}
                                onSaveChanges={onSaveChanges!}
                                onEditModeToggle={onEditModeToggle!}
                                onEditPost={onEditPost!}
                                onDeletePicture={onDeletePicture!}
                                onDeletePost={onDeletePost!}
                                onCategoryManagerOpen={onCategoryManagerOpen}
                                mediaItems={mediaItems}
                                localMediaItems={localMediaItems}
                            />
                        </div>

                        <CompactMediaDetails
                            isEditMode={!!isEditMode}
                            localMediaItems={localMediaItems}
                            setLocalMediaItems={setLocalMediaItems}
                            mediaItem={mediaItem}
                            versionImages={versionImages} // @ts-ignore or fix upstream
                            isLiked={!!isLiked}
                            likesCount={likesCount}
                            onLike={onLike}
                            onExpand={onExpand}
                            isOwner={!!isOwner}
                            setShowImageEditor={setShowImageEditor}
                            onDeletePicture={onDeletePicture!}
                            onAddAfter={() => onGalleryPickerOpen!(currentImageIndex + 1)}
                            onEditPicture={onEditPicture!}
                            onDownload={onDownload!}
                            isVideo={isVideo}
                            post={post}
                            orgSlug={orgSlug}
                            embedded={!!props.embedded}
                        />
                    </div>
                </div>
            </div>
            {showImageEditor && (
                <div className="fixed inset-0 z-[100] bg-background">
                    <React.Suspense fallback={<div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
                        <ImageEditor
                            imageUrl={mediaItem.image_url}
                            pictureId={mediaItem.id}
                            onClose={() => setShowImageEditor(false)}
                            onSave={() => {
                                setCacheBustKeys(prev => ({ ...prev, [mediaItem.id]: Date.now() }));
                                setShowImageEditor(false);
                                onLike();
                            }}
                        />
                    </React.Suspense>
                </div>
            )}
        </div>
    );
}
