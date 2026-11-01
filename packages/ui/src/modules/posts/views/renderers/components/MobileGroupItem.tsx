import React, { useState } from "react";
import { PostMediaItem } from "../../types";
import { FeedCarousel } from '@/components/feed/FeedCarousel';
import { CompactActionToolbar } from "./CompactActionToolbar";
import Comments from "@/components/Comments";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { formatDate, isLikelyFilename } from "@/utils/textUtils";
import { isVideoType, detectMediaType, normalizeMediaType } from "@/lib/mediaRegistry";
import { getVideoUrlWithResolution } from "../../utils";
import { getTikTokVideoId, getYouTubeVideoId, isTikTokUrl } from "@/utils/mediaUtils";
import { Loader2 } from 'lucide-react';
const VidstackPlayer = React.lazy(() => import('@/player/components/VidstackPlayerImpl').then(m => ({ default: m.VidstackPlayerImpl })));
import ResponsiveImage from "@/components/ResponsiveImage";
import { Button } from "@/components/ui/button";
import { Maximize, ExternalLink, Play } from 'lucide-react';

interface MobileGroupItemProps {
    group: PostMediaItem[];
    mediaItems: PostMediaItem[]; // Full list for global index calc
    isOwner: boolean;
    isLiked: boolean; // Post level or check individual item? Usually item.is_liked
    onMediaSelect: (item: PostMediaItem) => void;
    onLike: () => void;
    onDeletePicture: () => void;
    onGalleryPickerOpen: (index: number) => void;
    onExpand: (item: PostMediaItem) => void;
    onEditPicture: () => void;
    onDownload: () => void;
    setShowImageEditor: (show: boolean) => void;
    post?: any;
    orgSlug?: string;
    expandedComments: Record<string, boolean>;
    setExpandedComments: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
    expandedDescriptions: Record<string, boolean>;
    setExpandedDescriptions: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
    cacheBustKeys: Record<string, number>;
}

export const MobileGroupItem: React.FC<MobileGroupItemProps> = ({
    group,
    mediaItems,
    isOwner,
    isLiked, // Note: We should probably rely on item.is_liked
    onMediaSelect,
    onLike,
    onDeletePicture,
    onGalleryPickerOpen,
    onExpand,
    onEditPicture,
    onDownload,
    setShowImageEditor,
    post,
    orgSlug,
    expandedComments,
    setExpandedComments,
    expandedDescriptions,
    setExpandedDescriptions,
    cacheBustKeys
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [externalVideoState, setExternalVideoState] = useState<Record<string, boolean>>({});
    const item = group[currentIndex] || group[0];

    if (!item) return null;

    const hasVersions = group.length > 1;
    const itemEffectiveType = item.type || detectMediaType(item.image_url);
    const itemIsVideo = isVideoType(normalizeMediaType(itemEffectiveType));
    const itemVideoUrl = (itemIsVideo && item.image_url) ? getVideoUrlWithResolution(item.image_url) : undefined;

    // Calculate aspect ratio for FeedCarousel overlay
    let aspectRatio = 1;
    if (item.type === 'tiktok') {
        aspectRatio = 9 / 16;
    } else if (itemIsVideo) {
        aspectRatio = 16 / 9;
    }

    const isCommentsOpen = expandedComments[item.id];

    // Global index for "Add After"
    const globalIndex = mediaItems.findIndex(i => i.id === item.id);

    return (
        <div className="flex flex-col border-b last:border-0 pb-4 last:pb-0">
            {/* Media Display */}
            <div className={`relative w-full bg-black mb-2 ${item.type === 'tiktok'
                ? 'aspect-[9/16]'
                : (itemIsVideo ? 'aspect-video' : 'aspect-square')
                }`}>

                {hasVersions ? (
                    <FeedCarousel
                        items={group}
                        onIndexChanged={setCurrentIndex}
                        className="w-full h-full"
                        showContent={false}
                        onItemClick={(id) => {
                            const clicked = group.find(i => i.id === id);
                            if (clicked) {
                                onMediaSelect(clicked);
                                if (!isVideoType(normalizeMediaType(clicked.type || detectMediaType(clicked.image_url)))) {
                                    onExpand(clicked);
                                }
                            }
                        }}
                    />
                ) : (
                    // Single Item Render
                    <>
                        {itemIsVideo ? (
                            item.type === 'tiktok' ? (
                                <div className="w-full h-full flex justify-center bg-black">
                                    <iframe src={item.image_url} className="h-full aspect-[9/16] border-0" allow="encrypted-media;"></iframe>
                                </div>
                            ) : (
                                <React.Suspense fallback={<div className="w-full h-full bg-black flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-white" /></div>}>
                                    <VidstackPlayer
                                        title={item.title}
                                        src={itemVideoUrl}
                                        poster={item.thumbnail_url}
                                        className="w-full h-full"
                                    />
                                </React.Suspense>
                            )
                        ) : (
                            <ResponsiveImage
                                src={`${item.image_url}${cacheBustKeys[item.id] ? `?v=${cacheBustKeys[item.id]}` : ''}`}
                                alt={item.title}
                                imgClassName="w-full h-full object-contain"
                                sizes="(max-width: 768px) 100vw, 600px"
                                loading="lazy"
                                onClick={() => {
                                    onMediaSelect(item);
                                    onExpand(item);
                                }}
                            />
                        )}

                        {(item.type === 'page-external' && (
                            (getYouTubeVideoId((item.meta as any)?.url || item.image_url)) ? (
                                <div className="w-full h-full bg-black flex justify-center absolute inset-0 z-20">
                                    <iframe
                                        src={`https://www.youtube.com/embed/${getYouTubeVideoId((item.meta as any)?.url || item.image_url)}`}
                                        className="w-full h-full border-0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                        title={item.title}
                                    ></iframe>
                                </div>
                            ) : (isTikTokUrl((item.meta as any)?.url || item.image_url) ? (
                                (() => {
                                    const url = (item.meta as any)?.url || item.image_url;
                                    const tikTokId = getTikTokVideoId(url);
                                    const isPlaying = externalVideoState[item.id];

                                    if (isPlaying && tikTokId) {
                                        return (
                                            <div className="absolute inset-0 z-20 w-full h-full bg-black flex justify-center">
                                                <iframe
                                                    src={`https://www.tiktok.com/embed/v2/${tikTokId}`}
                                                    className="h-full aspect-[9/16] border-0"
                                                    allow="encrypted-media;"
                                                    title={item.title}
                                                ></iframe>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div className="absolute inset-0 z-20 flex items-center justify-center cursor-pointer group" onClick={() => {
                                            if (tikTokId) {
                                                setExternalVideoState(prev => ({ ...prev, [item.id]: true }));
                                            } else {
                                                window.open(url, '_blank')
                                            }
                                        }}>
                                            <div className="bg-black/50 rounded-full p-3 group-hover:bg-black/70 transition-colors backdrop-blur-sm">
                                                <Play className="w-8 h-8 text-white fill-white" />
                                            </div>
                                        </div>
                                    );
                                })()
                            ) : null)
                        ))}

                        {!itemIsVideo && (
                            <div className="absolute bottom-4 right-4 z-10">
                                <Button
                                    onClick={() => {
                                        onMediaSelect(item);
                                        onExpand(item);
                                    }}
                                    size="default"
                                    variant="ghost"
                                    className="bg-background/80 hover:bg-background/90 border backdrop-blur-sm"
                                >
                                    <Maximize className="h-5 w-5" />
                                </Button>
                            </div>
                        )}
                    </>
                )}

                {/* Index Indicator if Version Group */}
                {hasVersions && (
                    <div className="absolute top-4 right-4 z-10 bg-black/50 text-white px-2 py-1 rounded text-xs backdrop-blur-sm">
                        v{currentIndex + 1} / {group.length}
                    </div>
                )}
                {/* Global Index Indicator? Maybe irrelevant for grouped feed, or show group index? */}
            </div>

            {/* Actions Toolbar */}
            <div className="px-3 flex flex-col gap-2">
                <CompactActionToolbar
                    item={item}
                    isLiked={item.is_liked || false}
                    onLike={onLike}
                    isCommentsOpen={!!isCommentsOpen}
                    onToggleComments={() => setExpandedComments(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                    isVideo={itemIsVideo}
                    onExpand={onExpand}
                    isOwner={isOwner}
                    setShowImageEditor={setShowImageEditor}
                    onDeletePicture={onDeletePicture}
                    onAddAfter={() => onGalleryPickerOpen(globalIndex + 1)}
                    onEditPicture={onEditPicture}
                    onDownload={onDownload}
                    post={post}
                    orgSlug={orgSlug}
                    buttonSize="icon"
                />

                {(item.likes_count || 0) > 0 && <div className="font-semibold text-sm px-2 mb-2">{item.likes_count} likes</div>}

                {item.description && (
                    <div className="px-2 pb-2 space-y-1">
                        <div className="text-sm text-foreground/90">
                            <div className={expandedDescriptions[item.id] ? "" : "line-clamp-2"}>
                                <MarkdownRenderer content={item.description} className="prose-sm dark:prose-invert" />
                            </div>
                            {item.description.length > 100 && !expandedDescriptions[item.id] && (
                                <button
                                    onClick={() => setExpandedDescriptions(prev => ({ ...prev, [item.id]: true }))}
                                    className="text-muted-foreground text-xs mt-1 font-medium hover:text-foreground"
                                >
                                    more
                                </button>
                            )}
                        </div>
                        <div className="text-xs text-muted-foreground pt-1">
                            {formatDate(item.created_at)}
                        </div>
                    </div>
                )}

                {/* External Link */}
                {(item.type === 'page-external' || (item.meta as any)?.url) && (
                    <div className="px-3 pb-2">
                        <a
                            href={(item.meta as any)?.url || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-blue-500 hover:scale-[1.01] active:scale-[0.99] transition-transform bg-blue-50/50 p-2 rounded-md border border-blue-100 max-w-full"
                            onClick={(e) => e.stopPropagation()}
                            title={(item.meta as any)?.url}
                        >
                            <ExternalLink className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate hover:underline">{(item.meta as any)?.url}</span>
                        </a>
                    </div>
                )}

                {isCommentsOpen && (
                    <div className="mt-2 pl-2 border-l-2">
                        <Comments pictureId={item.id} initialComments={item.comments} />
                    </div>
                )}
            </div>
        </div>
    );
};
