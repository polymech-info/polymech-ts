import React from 'react';
import { Heart, Maximize, Share2, Grid } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { isVideoType, detectMediaType, normalizeMediaType } from "@/lib/mediaRegistry";
import { getVideoUrlWithResolution } from "../utils";
import ResponsiveImage from "@/components/ResponsiveImage";
import { Loader2 } from 'lucide-react';
const VidstackPlayer = React.lazy(() => import('@/player/components/VidstackPlayerImpl').then(m => ({ default: m.VidstackPlayerImpl })));
import { PostRendererProps } from '../types';

export const EmbedRenderer: React.FC<PostRendererProps> = (props) => {
    const {
        post, mediaItems, mediaItem,
        likesCount, isLiked,
        onExpand
    } = props;

    const [currentMediaId, setCurrentMediaId] = React.useState<string>(mediaItem?.id || (mediaItems[0]?.id));

    const currentItem = mediaItems.find(i => i.id === currentMediaId) || mediaItems[0];

    if (!currentItem) return <div className="text-center p-4">No content</div>;

    const effectiveType = currentItem.type || detectMediaType(currentItem.image_url);
    const isVideo = isVideoType(normalizeMediaType(effectiveType));
    const videoUrl = (isVideo && currentItem.image_url) ? getVideoUrlWithResolution(currentItem.image_url) : undefined;

    return (
        <div className="flex flex-col h-full bg-background relative group">

            {/* Main Media Area */}
            <div className="flex-1 relative overflow-hidden bg-black/5 flex items-center justify-center">
                {isVideo ? (
                    currentItem.type === 'tiktok' ? (
                        <div className="h-full aspect-[9/16] mx-auto bg-black">
                            <iframe
                                src={currentItem.image_url}
                                className="w-full h-full border-0"
                                allow="encrypted-media;"
                                title={currentItem.title}
                            ></iframe>
                        </div>
                    ) : (
                        <div className="w-full h-full">
                            <React.Suspense fallback={<div className="w-full h-full bg-black flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-white" /></div>}>
                                <VidstackPlayer
                                    title={currentItem.title}
                                    src={videoUrl}
                                    poster={currentItem.thumbnail_url}
                                    controls
                                    className="w-full h-full"
                                />
                            </React.Suspense>
                        </div>
                    )
                ) : (
                    <ResponsiveImage
                        src={currentItem.image_url}
                        alt={currentItem.title}
                        imgClassName="w-full h-full object-contain cursor-pointer"
                        sizes="(max-width: 1024px) 100vw, 1200px"
                        loading="eager"
                        data={currentItem.responsive}
                        onClick={() => onExpand(currentItem)} // Triggers open in new tab
                    />
                )}

                {/* Embed Overlay Brand/Link - visible on hover over media */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 rounded-full p-2 backdrop-blur-md">
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => onExpand(currentItem)}
                        className="text-white hover:text-white/80 h-8 w-8"
                        title="Open in PhotoShare"
                    >
                        <Maximize className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Filmstrip (only if multiple items) */}
            {mediaItems.length > 1 && (
                <div
                    ref={(el) => {
                        if (el) {
                            el.addEventListener('wheel', (e) => {
                                if (e.deltaY !== 0) {
                                    e.preventDefault();
                                    el.scrollLeft += e.deltaY;
                                }
                            }, { passive: false });
                        }
                    }}
                    className="h-20 bg-muted/30 border-t flex items-center p-2 gap-2 overflow-x-auto scrollbar-hide shrink-0"
                >
                    {mediaItems.map((item) => (
                        <div
                            key={item.id}
                            className={`relative h-16 w-16 shrink-0 rounded overflow-hidden cursor-pointer border-2 transition-all ${item.id === currentItem.id ? 'border-primary' : 'border-transparent hover:border-primary/50'
                                }`}
                            onClick={() => setCurrentMediaId(item.id)}
                        >
                            <ResponsiveImage
                                src={item.thumbnail_url || item.image_url}
                                alt={item.title}
                                imgClassName="w-full h-full object-cover"
                                sizes="64px"
                                data={item.responsive}
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* Footer / Meta */}
            <div className="p-3 bg-background border-t shrink-0 flex items-center justify-between">
                <div className="flex flex-col overflow-hidden mr-4 gap-0.5">
                    <h3 className="font-semibold text-sm truncate" title={post?.title}>{post?.title || "Untitled"}</h3>

                    {currentItem.title && currentItem.title !== post?.title && (
                        <div className="text-xs font-medium truncate opacity-90" title={currentItem.title}>{currentItem.title}</div>
                    )}

                    {(currentItem.description || post?.description) && (
                        <p className="text-xs text-muted-foreground truncate" title={currentItem.description || post?.description}>
                            {currentItem.description || post?.description}
                        </p>
                    )}
                </div>

                <div className="flex items-center gap-2 text-muted-foreground shrink-0">
                    <div className="flex items-center gap-1 text-xs font-medium">
                        <Heart className="h-3 w-3" fill={likesCount > 0 ? "currentColor" : "none"} />
                        <span>{likesCount}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
