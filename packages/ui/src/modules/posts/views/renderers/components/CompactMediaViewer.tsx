import React, { useEffect } from "react";
import { Loader2 } from 'lucide-react';
const VidstackPlayer = React.lazy(() => import('@/player/components/VidstackPlayerImpl').then(m => ({ default: m.VidstackPlayerImpl })));
import ResponsiveImage from "@/components/ResponsiveImage";
import { PostMediaItem } from "../../types";
import { getTikTokVideoId, getYouTubeVideoId, isTikTokUrl } from "@/utils/mediaUtils";
import { Play } from 'lucide-react';
import { SpyGlassImage } from "./SpyGlassImage";

interface CompactMediaViewerProps {
    mediaItem: PostMediaItem;
    isVideo: boolean;
    showDesktopLayout: boolean;
    mediaItems: PostMediaItem[];
    currentImageIndex: number;
    navigationData: any;
    handleNavigate: (direction: 'next' | 'prev') => void;
    onMediaSelect: (item: PostMediaItem) => void;
    onExpand: (item: PostMediaItem) => void;
    cacheBustKeys: Record<string, number>;
    navigate: (path: any) => void; // React Router navigate
    isOwner: boolean;
    videoPlaybackUrl?: string;
    videoPosterUrl?: string;
    imageFit?: 'contain' | 'cover';
    zoomEnabled?: boolean;
    autoPlayVideos?: boolean;
}

export const CompactMediaViewer: React.FC<CompactMediaViewerProps> = ({
    mediaItem,
    isVideo,
    showDesktopLayout,
    mediaItems,
    currentImageIndex,
    navigationData,
    handleNavigate,
    onMediaSelect,
    onExpand,
    cacheBustKeys,
    navigate,
    isOwner,
    videoPlaybackUrl,
    videoPosterUrl,
    imageFit = 'cover',
    zoomEnabled = false,
    autoPlayVideos = false
}) => {
    const [externalVideoState, setExternalVideoState] = React.useState<Record<string, boolean>>({});

    // Cleanup video player
    useEffect(() => {
        // Stop any background videos
        window.dispatchEvent(new CustomEvent('stop-video', { detail: { sourceId: 'compact-media-viewer' } }));
    }, []);

    // Version Control Logic
    const getVersionsForCurrentItem = () => {
        if (!mediaItem) return [];
        const rootId = mediaItem.parent_id || mediaItem.id;
        const visibleVersions = mediaItems.filter(item => {
            const isGroupMatch = (item.id === rootId) || (item.parent_id === rootId);
            if (!isGroupMatch) return false;
            if (!isOwner && !item.visible) return false;
            return true;
        });
        return visibleVersions.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    };

    const currentVersions = getVersionsForCurrentItem();
    const currentVersionIndex = currentVersions.findIndex(v => v.id === mediaItem.id);

    const handleVersionSwitch = (direction: 'next' | 'prev') => {
        if (currentVersions.length <= 1) return;
        let newIndex = direction === 'next' ? currentVersionIndex + 1 : currentVersionIndex - 1;
        if (newIndex >= currentVersions.length) newIndex = 0;
        if (newIndex < 0) newIndex = currentVersions.length - 1;

        const nextVersion = currentVersions[newIndex];
        if (nextVersion) {
            onMediaSelect(nextVersion);
        }
    };

    // Keyboard navigation for versions
    useEffect(() => {
        if (!showDesktopLayout) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                handleVersionSwitch('prev');
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                handleVersionSwitch('next');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showDesktopLayout, currentVersions, currentVersionIndex, mediaItem]);



    return (
        <div className="absolute inset-0 flex items-center justify-center px-1">
            {showDesktopLayout ? (
                isVideo ? (
                    mediaItem.mediaType === 'tiktok' ? (
                        <div className="w-full h-full bg-black flex justify-center">
                            <iframe
                                src={mediaItem.image_url}
                                className="h-full aspect-[9/16] border-0"
                                allow="encrypted-media;"
                                title={mediaItem.title}
                            ></iframe>
                        </div>
                    ) : (
                        <div className="w-full h-full">
                            <React.Suspense fallback={<div className="w-full h-full bg-black flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-white" /></div>}>
                                <VidstackPlayer
                                    title={mediaItem.title}
                                    src={videoPlaybackUrl}
                                    poster={videoPosterUrl}
                                    load="idle"
                                    posterLoad="eager"
                                    controls
                                    autoPlay={autoPlayVideos}
                                    muted={autoPlayVideos}
                                    className="w-full h-full"
                                />
                            </React.Suspense>
                        </div>
                    )
                ) : (
                    (() => {
                        if (mediaItem.mediaType === 'page-external') {
                            const url = (mediaItem.meta as any)?.url || mediaItem.image_url;
                            const ytId = getYouTubeVideoId(url);

                            if (ytId) {
                                return (
                                    <div className="w-full h-full bg-black flex justify-center">
                                        <iframe
                                            src={`https://www.youtube.com/embed/${ytId}`}
                                            className="w-full h-full border-0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                            title={mediaItem.title}
                                        ></iframe>
                                    </div>
                                );
                            }

                            if (isTikTokUrl(url)) {
                                const tikTokId = getTikTokVideoId(url);
                                const isPlaying = showDesktopLayout && externalVideoState[mediaItem.id];

                                if (isPlaying && tikTokId) {
                                    return (
                                        <div className="w-full h-full bg-black flex justify-center">
                                            <iframe
                                                src={`https://www.tiktok.com/embed/v2/${tikTokId}`}
                                                className="h-full aspect-[9/16] border-0"
                                                allow="encrypted-media;"
                                                title={mediaItem.title}
                                            ></iframe>
                                        </div>
                                    );
                                }

                                return (
                                    <div className="relative w-full h-full group" onClick={() => {
                                        if (tikTokId) {
                                            setExternalVideoState(prev => ({ ...prev, [mediaItem.id]: true }));
                                        } else {
                                            window.open(url, '_blank')
                                        }
                                    }}>
                                        <ResponsiveImage
                                            src={`${mediaItem.image_url}${cacheBustKeys[mediaItem.id] ? `?v=${cacheBustKeys[mediaItem.id]}` : ''}`}
                                            alt={mediaItem.title}
                                            imgClassName="w-full h-full object-contain cursor-pointer select-none opacity-80 group-hover:opacity-60 transition-opacity"
                                            sizes="(max-width: 1024px) 100vw, 1200px"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <div className="bg-black/50 p-4 group-hover:bg-black/70 transition-colors">
                                                <Play className="w-12 h-12 text-white fill-white" />
                                            </div>
                                        </div>
                                    </div>
                                );
                            }
                        }


                        // Main Image Viewer with conditional SpyGlass
                        if (zoomEnabled) {
                            return (
                                <SpyGlassImage
                                    src={`${mediaItem.image_url}${cacheBustKeys[mediaItem.id] ? `?v=${cacheBustKeys[mediaItem.id]}` : ''}`}
                                    alt={mediaItem.title}
                                    className="w-full h-full"
                                    onClick={() => onExpand(mediaItem)}
                                    imageFit={imageFit}
                                />
                            );
                        }

                        return (
                            <ResponsiveImage
                                src={`${mediaItem.image_url}${cacheBustKeys[mediaItem.id] ? `?v=${cacheBustKeys[mediaItem.id]}` : ''}`}
                                alt={mediaItem.title}
                                imgClassName={`w-full h-full object-${imageFit} cursor-pointer select-none`}
                                onClick={() => onExpand(mediaItem)}
                                title="Double-tap to view fullscreen"
                                sizes="(max-width: 1024px) 100vw, 1200px"
                            />
                        );
                    })()
                )
            ) : null}



            {/* Navigation arrows */}
            {(currentImageIndex > 0 || (navigationData && navigationData.currentIndex > 0)) && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        if (currentImageIndex > 0) {
                            onMediaSelect(mediaItems[currentImageIndex - 1]);
                        } else {
                            handleNavigate('prev');
                        }
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-background/80 hover:bg-background/90 text-foreground border rounded-full flex items-center justify-center transition-all z-30 backdrop-blur-sm shadow-md"
                    title={currentImageIndex > 0 ? "Previous image" : "Previous post"}
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
            )}

            <button
                onClick={(e) => {
                    e.stopPropagation();
                    if (currentImageIndex < mediaItems.length - 1) {
                        onMediaSelect(mediaItems[currentImageIndex + 1]);
                    } else {
                        handleNavigate('next');
                    }
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-background/80 hover:bg-background/90 text-foreground border rounded-full flex items-center justify-center transition-all z-30 backdrop-blur-sm shadow-md"
                title="Next"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </button>
        </div>
    );
};
