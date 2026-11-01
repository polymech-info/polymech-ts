import React, { useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import ResponsiveImage from '@/components/ResponsiveImage';

interface SpyGlassImageProps {
    src: string;
    alt: string;
    className?: string;
    zoomLevel?: number; // Zoom level (e.g., 2 = 200%)
    onClick?: () => void;
    imageFit?: 'contain' | 'cover';
}

export const SpyGlassImage: React.FC<SpyGlassImageProps> = ({
    src,
    alt,
    className,
    zoomLevel = 2,
    onClick,
    imageFit = 'cover'
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isHovering, setIsHovering] = useState(false);
    const [backgroundPosition, setBackgroundPosition] = useState('0% 0%');
    const [currentZoom, setCurrentZoom] = useState(zoomLevel);

    // Reset zoom when zoomLevel prop changes or when not hovering (optional, but good UX to reset)
    // Actually, keeping the zoom level persistent while hovering is better.
    // We can reset it when entering if we want, but user might want to keep their setting.
    // Let's rely on state.

    // Update state if prop changes, but only if we haven't touched it? 
    // Or just simple effect:
    React.useEffect(() => {
        setCurrentZoom(zoomLevel);
    }, [zoomLevel]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current) return;

        const { left, top, width, height } = containerRef.current.getBoundingClientRect();

        // Calculate mouse position relative to the image container
        const x = e.clientX - left;
        const y = e.clientY - top;

        // Calculate percentage for background position
        const xPercent = (x / width) * 100;
        const yPercent = (y / height) * 100;

        setBackgroundPosition(`${xPercent}% ${yPercent}%`);
    };

    const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
        // Prevent page scroll
        e.stopPropagation();
        // e.preventDefault(); // React's SyntheticEvent doesn't support passive false helper easily here without ref listener, 
        // but we can try. If browser complains about passive, we might need a ref listener.

        // Let's blindly try to update zoom
        const delta = -e.deltaY * 0.005; // speed factor
        setCurrentZoom(prev => {
            const next = prev + delta;
            return Math.min(Math.max(next, 1.1), 10); // Clamp between 1.1x and 10x
        });
    };

    // Use a ref for wheel listener to support non-passive event prevention if needed
    React.useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const onWheel = (e: WheelEvent) => {
            if (isHovering) {
                e.preventDefault();
                const delta = -e.deltaY * 0.005;
                setCurrentZoom(prev => {
                    const next = prev + delta;
                    return Math.min(Math.max(next, 1.1), 10);
                });
            }
        };

        container.addEventListener('wheel', onWheel, { passive: false });
        return () => container.removeEventListener('wheel', onWheel);
    }, [isHovering]);

    const handleMouseEnter = () => setIsHovering(true);
    const handleMouseLeave = () => setIsHovering(false);

    return (
        <div
            ref={containerRef}
            className={cn("relative w-full h-full overflow-hidden cursor-zoom-in group", className)}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={onClick}
        >
            {/* Main Image (Visible when not hovering) */}
            <ResponsiveImage
                src={src}
                alt={alt}
                imgClassName={cn(
                    "w-full h-full transition-opacity duration-200",
                    imageFit === 'contain' ? 'object-contain' : 'object-cover',
                    isHovering ? 'opacity-0' : 'opacity-100'
                )}
                sizes="(max-width: 1024px) 100vw, 1200px"
            />

            {/* Zoomed Background Image (Visible when hovering) */}
            {isHovering && (
                <div
                    className="absolute inset-0 z-10 bg-no-repeat pointer-events-none"
                    style={{
                        backgroundImage: `url(${src})`,
                        backgroundSize: `${currentZoom * 100}%`,
                        backgroundPosition: backgroundPosition,
                        // Match visual fit of the underlying image if possible, 
                        // though 'cover' is standard for this type of zoom.
                        // If imageFit is 'contain', the zoom effect might look misaligned if the image doesn't fill the box.
                        // For 'cover', this background approach works perfectly.
                    }}
                />
            )}
        </div>
    );
};
