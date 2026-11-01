
import { useState, useEffect, useMemo } from 'react';
import { ResponsiveData } from '@/components/ResponsiveImage';
import { serverUrl, apiClient } from '@/lib/db';

interface UseResponsiveImageProps {
    src: string | File | null;
    responsiveSizes?: number[];
    formats?: string[];
    enabled?: boolean;
    apiUrl?: string;
}

const DEFAULT_SIZES = [180, 640, 1024];
const DEFAULT_FORMATS = ['avif', 'webp', 'jpeg'];

// Module-level cache to deduplicate requests
// Key: stringified request params, Value: Promise<ResponsiveData>
const requestCache = new Map<string, Promise<ResponsiveData>>();

// Concurrency limiter — at most N responsive-image requests in flight at once
const MAX_CONCURRENT = 3;
let _activeSlots = 0;
const _slotQueue: (() => void)[] = [];

function _acquireSlot(): Promise<void> {
    if (_activeSlots < MAX_CONCURRENT) {
        _activeSlots++;
        return Promise.resolve();
    }
    return new Promise<void>(resolve => { _slotQueue.push(resolve); });
}

function _releaseSlot(): void {
    if (_slotQueue.length > 0) {
        _slotQueue.shift()!();
    } else {
        _activeSlots--;
    }
}

export const useResponsiveImage = ({
    src,
    responsiveSizes = DEFAULT_SIZES,
    formats = DEFAULT_FORMATS,
    enabled = true,
    apiUrl = serverUrl,
}: UseResponsiveImageProps) => {
    const [data, setData] = useState<ResponsiveData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Stable key for deps — only changes when array contents actually change
    const sizesKey = useMemo(() => JSON.stringify(responsiveSizes), [responsiveSizes]);
    const formatsKey = useMemo(() => JSON.stringify(formats), [formats]);

    useEffect(() => {
        let isMounted = true;
        const generateResponsiveImages = async () => {
            if (!src || !enabled) {
                if (isMounted) {
                    // Only reset if disabled or no src, but if we already have data we might want to keep it?
                    // actually if distinct src change, reset. if just disabled, maybe do nothing?
                    // For now, if disabled, we just don't start.
                    if (!src) {
                        setData(null);
                        setLoading(false);
                    }
                }
                return;
            }

            // Data URIs bypass the concurrency limiter (no network)
            if (typeof src === 'string' && src.startsWith('data:')) {
                if (isMounted) {
                    setData({
                        img: { src, width: 0, height: 0, format: 'unknown' },
                        sources: []
                    });
                    setLoading(false);
                }
                return;
            }

            await _acquireSlot();
            if (!isMounted) { _releaseSlot(); return; }

            if (isMounted) {
                setLoading(true);
                setError(null);
            }

            try {
                if (typeof src === 'string') {
                    const cacheKey = JSON.stringify({ src, sizes: responsiveSizes, formats, apiUrl });

                    if (!requestCache.has(cacheKey)) {
                        const requestPromise = (async () => {
                            const serverBase = apiUrl;
                            let resolvedSrc = src;
                            if (src.startsWith('/')) {
                                resolvedSrc = `${serverBase}${src}`;
                            } else if (!src.startsWith('http://') && !src.startsWith('https://')) {
                                resolvedSrc = new URL(src, serverBase).href;
                            }
                            const params = new URLSearchParams({
                                url: resolvedSrc,
                                sizes: JSON.stringify(responsiveSizes),
                                formats: JSON.stringify(formats),
                            });

                            const responsiveUrl = `${serverBase.replace(/\/$/, '')}/api/images/responsive?${params.toString()}`;
                            try {
                                return await apiClient<ResponsiveData>(responsiveUrl);
                            } catch (e) {
                                requestCache.delete(cacheKey);
                                throw e;
                            }
                        })();

                        requestCache.set(cacheKey, requestPromise);
                    }

                    const result = await requestCache.get(cacheKey)!;
                    if (isMounted) {
                        setData(result);
                    }
                } else {
                    const formData = new FormData();
                    formData.append('file', src);
                    formData.append('sizes', JSON.stringify(responsiveSizes));
                    formData.append('formats', JSON.stringify(formats));

                    const response = await fetch(`${serverUrl}/api/images/responsive`, {
                        method: 'POST',
                        body: formData,
                    });

                    if (!response.ok) {
                        const txt = await response.text();
                        throw new Error(txt || 'Failed to generate responsive images');
                    }

                    const result = await response.json();
                    if (isMounted) {
                        setData(result);
                    }
                }
            } catch (err: any) {
                console.error('Error generating responsive images:', err);
                if (isMounted) {
                    setError(err.message);
                }
            } finally {
                _releaseSlot();
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        generateResponsiveImages();

        return () => {
            isMounted = false;
        };
    }, [src, sizesKey, formatsKey, enabled]);

    return { data, loading, error };
};
