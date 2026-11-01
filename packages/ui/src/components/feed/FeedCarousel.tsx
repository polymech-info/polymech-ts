import React, { useState, useCallback, useEffect } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { MediaItem } from '@/types';
import { cn } from '@/lib/utils';
import MediaCard from '@/components/MediaCard';

interface CarouselProps {
    items: MediaItem[];
    onIndexChanged?: (index: number) => void;
    className?: string;
    aspectRatio?: number;
    author?: string;
    authorId?: string;
    authorAvatarUrl?: string | null;
    onItemClick?: (id: string) => void;
    showContent?: boolean;
    showTitle?: boolean;
    showDescription?: boolean;
    showAuthor?: boolean;
    showActions?: boolean;
}

export const FeedCarousel: React.FC<CarouselProps> = ({
    items,
    onIndexChanged,
    className,
    aspectRatio = 1, // Square by default, typical for feeds
    author,
    authorId,
    authorAvatarUrl,
    onItemClick,
    showContent = true,
    showTitle,
    showDescription,
    showAuthor,
    showActions
}) => {
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });
    const [selectedIndex, setSelectedIndex] = useState(0);

    // @todo: picture visible 
    items = items.filter(item => item.visible !== false);

    const onSelect = useCallback(() => {
        if (!emblaApi) return;
        const index = emblaApi.selectedScrollSnap();
        setSelectedIndex(index);
        if (onIndexChanged) {
            onIndexChanged(index);
        }
    }, [emblaApi, onIndexChanged]);

    useEffect(() => {
        if (!emblaApi) return;
        emblaApi.on('select', onSelect);
        return () => {
            emblaApi.off('select', onSelect);
        }
    }, [emblaApi, onSelect]);

    if (!items || items.length === 0) return null;

    // Dot indicators - positioned over the image area
    const dots = items.length > 1 ? (
        <div
            className="absolute inset-0 pointer-events-none flex flex-col justify-end pb-4 z-10"
        >
            <div className="flex justify-center gap-1.5">
                {items.map((_, index) => (
                    <div
                        key={index}
                        className={cn(
                            "w-1.5 h-1.5 rounded-full transition-all duration-300 shadow-md ring-1 ring-black/10",
                            index === selectedIndex
                                ? "bg-white scale-125"
                                : "bg-white/60 hover:bg-white/80"
                        )}
                    />
                ))}
            </div>
        </div>
    ) : null;

    return (
        <div className={cn("relative overflow-hidden", className)}>
            <div ref={emblaRef} className="overflow-hidden w-full h-full cursor-grab active:cursor-grabbing">
                <div className="flex w-full h-full" style={{ touchAction: 'pan-y pinch-zoom' }}>
                    {items.map((item, index) => {
                        return (
                            <div key={item.id} className="flex-[0_0_100%] min-w-0 relative">
                                <MediaCard
                                    id={item.id}
                                    pictureId={item.id}
                                    url={item.image_url}
                                    thumbnailUrl={item.thumbnail_url}
                                    title={item.title || `Slide ${index + 1}`}
                                    type={item.type}
                                    author={author || 'User'}
                                    authorId={authorId || item.user_id}
                                    authorAvatarUrl={authorAvatarUrl}
                                    likes={item.likes_count || 0}
                                    comments={0}
                                    description={item.description}
                                    created_at={item.created_at}
                                    showContent={showContent}
                                    showTitle={showTitle}
                                    showDescription={showDescription}
                                    showAuthor={showAuthor}
                                    showActions={showActions}
                                    onClick={onItemClick}
                                    job={item.job}
                                    responsive={item.responsive}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>
            {dots}
        </div>
    );
};

export default FeedCarousel;
