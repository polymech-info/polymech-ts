import React, { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import { useResponsiveImage } from '@/hooks/useResponsiveImage';

interface ResponsiveImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
    src: string | File;
    sizes?: string;
    className?: string;
    imgClassName?: string;
    responsiveSizes?: number[];
    formats?: string[];
    alt: string;
    onDataLoaded?: (data: ResponsiveData) => void;
    rootMargin?: string;
    data?: ResponsiveData;
    apiUrl?: string;
}

export interface ResponsiveData {
    img: {
        src: string;
        width: number;
        height: number;
        format: string;
    };
    sources?: {
        srcset: string;
        type: string;
    }[];
    stats?: any;
}

const DEFAULT_RESPONSIVE_SIZES = [640, 1280];
const DEFAULT_FORMATS = ['avif'];

const ResponsiveImage: React.FC<ResponsiveImageProps> = React.memo(({
    src,
    sizes = '(max-width: 1024px) 100vw, 50vw',
    className,
    imgClassName,
    responsiveSizes = DEFAULT_RESPONSIVE_SIZES,
    formats = DEFAULT_FORMATS,
    alt,
    onDataLoaded,
    rootMargin = '240px',
    onLoad,
    onError,
    data: providedData,
    apiUrl,
    ...props
}) => {
    // Lazy load logic
    const [isInView, setIsInView] = useState(props.loading === 'eager');
    const [imgLoaded, setImgLoaded] = useState(false);
    /** When render URLs fail, show original src (e.g. VFS) — same as opening in a new tab */
    const [fallbackOriginal, setFallbackOriginal] = useState(false);
    const observerRef = useRef<IntersectionObserver | null>(null);
    const imgRef = useRef<HTMLImageElement>(null);

    const placeholderRef = useCallback(
        (node: HTMLSpanElement | null) => {
            observerRef.current?.disconnect();
            observerRef.current = null;
            if (!node || props.loading === 'eager') return;

            const observer = new IntersectionObserver(([entry]) => {
                if (entry.isIntersecting) {
                    setIsInView(true);
                    observer.disconnect();
                }
            }, { rootMargin });

            observer.observe(node);
            observerRef.current = observer;
        },
        [props.loading, rootMargin],
    );

    useLayoutEffect(() => {
        return () => {
            observerRef.current?.disconnect();
            observerRef.current = null;
        };
    }, []);

    const hookResult = useResponsiveImage({
        src: src as string | File,
        responsiveSizes,
        formats,
        enabled: isInView && !providedData,
        apiUrl: apiUrl
    });

    const data = providedData || hookResult.data;
    const loading = !providedData && hookResult.loading;
    const error = !providedData && hookResult.error;

    useEffect(() => {
        if (data && onDataLoaded) {
            onDataLoaded(data);
        }
    }, [data, onDataLoaded]);

    // Reset loaded state when src changes
    useEffect(() => {
        setImgLoaded(false);
        setFallbackOriginal(false);
    }, [src]);

    // Check if image is already loaded (from cache)
    useEffect(() => {
        const img = imgRef.current;
        if (img?.complete && img.naturalWidth > 0) {
            setImgLoaded(true);
        }
    }, [data]);


    // If we are enabled (isInView) but have no data and no error yet,
    // we are effectively in a "pending load" state.
    const isLoadingOrPending = loading || (isInView && !data && !error);

    if (!isInView || isLoadingOrPending) {
        // Use className for wrapper if provided, otherwise generic
        // We attach the ref here to detect when this placeholder comes into view
        return <span ref={placeholderRef} className={`block animate-pulse dark:bg-gray-800 bg-gray-200 w-full h-full ${className || ''}`} />;
    }

    if (error || !data) {
        // Fallback if generation failed
        if (typeof src === 'string') {
            return <img src={src} alt={alt} className={imgClassName || className} {...props} />;
        }
        return <span className="block text-red-500 text-xs">Failed to load image</span>;
    }

    if (fallbackOriginal && typeof src === 'string') {
        return (
            <span className={`relative block w-full h-full overflow-hidden ${className || ''}`}>
                <img
                    ref={imgRef}
                    src={src}
                    alt={alt}
                    className={`${imgClassName || ''} transition-opacity duration-300 opacity-100`}
                    loading={props.loading || 'lazy'}
                    decoding="async"
                    {...props}
                />
            </span>
        );
    }

    return (
        <span className={`relative block w-full h-full overflow-hidden ${className || ''}`}>
            <picture>
                {(data.sources || []).map((source, index) => (
                    <source key={index} srcSet={source.srcset} type={source.type} sizes={sizes} />
                ))}
                <img
                    ref={imgRef}
                    src={data.img.src}
                    alt={alt}
                    // Only apply width/height if they are known (> 0)
                    // This fixes an issue where Data URIs (which return 0/0) render as invisible 0x0 images
                    width={data.img.width > 0 ? data.img.width : undefined}
                    height={data.img.height > 0 ? data.img.height : undefined}
                    className={`${imgClassName || ''} transition-opacity duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
                    onLoad={(e) => {
                        setImgLoaded(true);
                        onLoad?.(e);
                    }}
                    onError={(e) => {
                        if (typeof src === 'string') {
                            setFallbackOriginal(true);
                            return;
                        }
                        setImgLoaded(true);
                        onError?.(e);
                    }}
                    loading={props.loading || "lazy"}
                    decoding="async"
                    {...props}
                />
            </picture>
            {!imgLoaded && (
                <span className="absolute inset-0 flex items-center justify-center dark:bg-gray-800 bg-gray-100/50 z-10 pointer-events-none">
                    <span className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></span>
                </span>
            )}
        </span>
    );
}, (prev, next) => {
    // Only compare props that affect visual output — ignore callbacks
    return prev.src === next.src &&
        prev.sizes === next.sizes &&
        prev.className === next.className &&
        prev.imgClassName === next.imgClassName &&
        prev.alt === next.alt &&
        prev.loading === next.loading &&
        prev.data === next.data &&
        prev.responsiveSizes === next.responsiveSizes &&
        prev.formats === next.formats &&
        prev.rootMargin === next.rootMargin &&
        prev.apiUrl === next.apiUrl;
});

export default ResponsiveImage;
