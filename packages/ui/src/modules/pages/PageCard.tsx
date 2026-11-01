import React from 'react';
import { Heart, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import ResponsiveImage from "@/components/ResponsiveImage";
import UserAvatarBlock from "@/components/UserAvatarBlock";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import type { MediaRendererProps } from "@/lib/mediaRegistry";

/** Extensible preset configuration for card display */
export interface CardPreset {
    showTitle?: boolean;
    showDescription?: boolean;
    showAuthor?: boolean;
    showActions?: boolean;
}

interface PageCardProps extends Omit<MediaRendererProps, 'created_at'> {
    variant?: 'grid' | 'feed';
    responsive?: any;
    showContent?: boolean;
    showHeader?: boolean;
    overlayMode?: 'hover' | 'always';
    authorAvatarUrl?: string | null;
    created_at?: string;
    apiUrl?: string;
    versionCount?: number;
    preset?: CardPreset;
    className?: string;
    showTitle?: boolean;
    showDescription?: boolean;
    showAuthor?: boolean;
    showActions?: boolean;
}

const PageCard: React.FC<PageCardProps> = ({
    id,
    url,
    thumbnailUrl,
    title,
    author,
    authorId,
    authorAvatarUrl,
    likes,
    comments,
    isLiked,
    description,
    onClick,
    onLike,
    created_at,
    variant = 'grid',
    responsive,
    showContent = true,
    showHeader = true,
    overlayMode = 'hover',
    apiUrl,
    versionCount,
    preset,
    type,
    className,
    showTitle,
    showDescription,
    showAuthor,
    showActions
}) => {
    // Determine image source
    // If url is missing or empty, fallback to picsum
    // For PAGE_EXTERNAL, currently 'url' is the link and 'thumbnailUrl' is the image.

    const displayImage = thumbnailUrl || url || "https://picsum.photos/640";

    /** When false/undefined, grid uses square crop; when true, allow flexible height below image. */
    const gridTitleSlot = !!(showTitle ?? preset?.showTitle);
    const gridTitleOn = (showTitle ?? preset?.showTitle) !== false;
    const gridDescriptionOn = !!(showDescription ?? preset?.showDescription);

    const handleLike = (e: React.MouseEvent) => {
        e.stopPropagation();
        onLike?.();
    };

    const handleCardClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onClick?.(id);
    };

    if (variant === 'feed') {
        return (
            <div
                data-testid="page-card"
                className="group relative overflow-hidden transition-all duration-300 cursor-pointer w-full mb-4 bg-card"
                onClick={handleCardClick}
            >

                <div className={`relative w-full aspect-[16/9] overflow-hidden bg-muted`}>
                    <ResponsiveImage
                        src={displayImage}
                        alt={title}
                        className="w-full h-full"
                        imgClassName="w-full h-full object-contain transition-transform duration-300"
                        sizes="100vw"
                        data={responsive}
                        apiUrl={apiUrl}
                    />
                </div>

                {showContent && (
                    <div className="pb-2 space-y-2">
                        {/* Author + Actions row */}
                        <div className="flex items-center justify-between px-2 pt-2">
                            {(showAuthor ?? preset?.showAuthor) !== false && (
                                <UserAvatarBlock
                                    userId={authorId}
                                    avatarUrl={authorAvatarUrl}
                                    displayName={author}
                                    className="w-8 h-8"
                                    showDate={true}
                                    createdAt={created_at}
                                />
                            )}
                            {(showActions ?? preset?.showActions) !== false && (
                                <div className="flex items-center gap-1">
                                    <Button size="sm" variant="ghost" className="px-0 gap-1" onClick={handleLike}>
                                        <Heart className={`h-5 w-5 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
                                        <span>{likes}</span>
                                    </Button>
                                    <Button size="sm" variant="ghost" className="px-0 gap-1">
                                        <MessageCircle className="h-5 w-5" />
                                        <span>{comments}</span>
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Title & Description */}
                        <div className="px-4 space-y-1">
                            {(showTitle ?? preset?.showTitle) !== false && (
                                <div className="font-semibold text-sm">{title}</div>
                            )}
                            {!!(showDescription ?? preset?.showDescription) && description && (
                                <div className="text-sm text-foreground/90 line-clamp-3">
                                    <MarkdownRenderer content={description} className="prose-sm dark:prose-invert" />
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Grid Variant
    return (
        <div
            data-testid="page-card"
            className={`group relative overflow-hidden bg-card transition-all duration-300 cursor-pointer w-full flex flex-col ${gridTitleSlot ? '' : 'md:aspect-square'} ${className || ''}`}
            onClick={handleCardClick}
        >
            <div className={`relative w-full overflow-hidden ${className?.includes('h-full') ? 'flex-1 min-h-0' : 'aspect-square'}`}>
                <ResponsiveImage
                    src={displayImage}
                    alt={title}
                    className="w-full h-full"
                    imgClassName="w-full h-full object-contain transition-transform duration-300"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 50vw"
                    responsiveSizes={[640, 1024, 1440]}
                    data={responsive}
                    apiUrl={apiUrl}
                />

                {/* TESTING: Entire hover overlay disabled */}
                {false && showContent && (
                    <div className={`hidden md:block absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent ${overlayMode === 'always' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity duration-300 pointer-events-none`}>
                        <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-auto">
                            <div className="flex items-center justify-between mb-2">
                                {preset?.showAuthor !== false && (
                                    <UserAvatarBlock
                                        userId={authorId}
                                        avatarUrl={authorAvatarUrl}
                                        displayName={author}
                                        hoverStyle={true}
                                        showDate={false}
                                    />
                                )}

                                {preset?.showActions !== false && (
                                    <div className="flex items-center space-x-1">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={handleLike}
                                            className={`h-8 w-8 p-0 ${isLiked ? "text-red-500" : "text-white hover:text-red-500"}`}
                                        >
                                            <Heart className="h-4 w-4" fill={isLiked ? "currentColor" : "none"} />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
            {/* Info bar below image (preset or explicit props) */}
            {(gridTitleOn || gridDescriptionOn) && (title || description) && (
                <div className="px-2.5 py-2 border-t bg-muted/40">
                    {gridTitleOn && title && (
                        <h3 className="text-sm font-medium truncate">{title}</h3>
                    )}
                    {gridDescriptionOn && description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{description}</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default PageCard;
