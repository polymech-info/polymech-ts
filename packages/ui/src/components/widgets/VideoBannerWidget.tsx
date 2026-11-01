import React, { useState, useEffect, useCallback } from 'react';
import { T, translate } from '@/i18n';
import { ImagePickerDialog } from '@/components/widgets/ImagePickerDialog';
import { PagePickerDialog } from '@/modules/pages/PagePickerDialog';
import { fetchPictureById } from '@/modules/posts/client-pictures';
import { Plus, Trash2, Video, Image as ImageIcon, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import ResponsiveImage from '@/components/ResponsiveImage';
import { serverUrl } from '@/lib/db';

export interface ButtonConfig {
    id: string;
    label: string;
    targetPageId?: string;
    targetPageSlug?: string;
    targetPageOwner?: string;
    href?: string;
}

export interface VideoBannerWidgetProps {
    videoId?: string | null;
    posterImageId?: string | null;
    backgroundImageId?: string | null;
    heading?: string;
    description?: string;
    minHeight?: number;
    overlayOpacity?: 'light' | 'medium' | 'dark';
    objectFit?: 'contain' | 'cover';
    buttons?: ButtonConfig[];
    isEditMode?: boolean;
    onPropsChange?: (props: Record<string, any>) => void;
    [key: string]: any;
}

interface VideoInfo {
    playbackUrl: string;
    posterUrl: string;
    title: string;
    responsive?: any;
}

interface PosterInfo {
    url: string;
    title: string;
    responsive?: any;
}

interface BackgroundImageInfo {
    url: string;
    title: string;
    responsive?: any;
}

const VideoBannerWidget: React.FC<VideoBannerWidgetProps> = ({
    videoId = null,
    posterImageId = null,
    backgroundImageId = null,
    heading = '',
    description = '',
    minHeight = 500,
    overlayOpacity = 'medium',
    objectFit = 'cover',
    buttons = [],
    isEditMode = false,
    onPropsChange,
}) => {
    const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
    const [posterInfo, setPosterInfo] = useState<PosterInfo | null>(null);
    const [bgImageInfo, setBgImageInfo] = useState<BackgroundImageInfo | null>(null);
    const [showVideoPicker, setShowVideoPicker] = useState(false);
    const [showPosterPicker, setShowPosterPicker] = useState(false);
    const [showBgImagePicker, setShowBgImagePicker] = useState(false);
    const [showPagePicker, setShowPagePicker] = useState(false);
    const [editingButtonId, setEditingButtonId] = useState<string | null>(null);
    const [isPaused, setIsPaused] = useState(false);
    const videoRef = React.useRef<HTMLVideoElement>(null);

    // Fetch video info when videoId changes
    useEffect(() => {
        if (!videoId) { setVideoInfo(null); return; }
        let cancelled = false;
        const fetchVideo = async () => {
            try {
                const data = await fetchPictureById(videoId);
                if (cancelled || !data) return;
                setVideoInfo({
                    playbackUrl: data.image_url,
                    posterUrl: data.thumbnail_url || '',
                    title: data.title,
                    responsive: data.responsive,
                });
            } catch (e) { console.error('Failed to fetch video:', e); }
        };
        fetchVideo();
        return () => { cancelled = true; };
    }, [videoId]);

    // Fetch poster info when posterImageId changes
    useEffect(() => {
        if (!posterImageId) { setPosterInfo(null); return; }
        let cancelled = false;
        const fetchPoster = async () => {
            try {
                const data = await fetchPictureById(posterImageId);
                if (cancelled || !data) return;
                setPosterInfo({
                    url: data.image_url,
                    title: data.title,
                    responsive: data.responsive,
                });
            } catch (e) { console.error('Failed to fetch poster:', e); }
        };
        fetchPoster();
        return () => { cancelled = true; };
    }, [posterImageId]);

    // Fetch background image info when backgroundImageId changes
    useEffect(() => {
        if (!backgroundImageId) { setBgImageInfo(null); return; }
        let cancelled = false;
        const fetchBg = async () => {
            try {
                const data = await fetchPictureById(backgroundImageId);
                if (cancelled || !data) return;
                setBgImageInfo({
                    url: data.image_url,
                    title: data.title,
                    responsive: data.responsive,
                });
            } catch (e) { console.error('Failed to fetch background image:', e); }
        };
        fetchBg();
        return () => { cancelled = true; };
    }, [backgroundImageId]);

    const handleVideoSelect = useCallback((picture: any) => {
        onPropsChange?.({ videoId: picture.id });
        setShowVideoPicker(false);
    }, [onPropsChange]);

    const handlePosterSelect = useCallback((picture: any) => {
        onPropsChange?.({ posterImageId: picture.id });
        setShowPosterPicker(false);
    }, [onPropsChange]);

    const handleBgImageSelect = useCallback((picture: any) => {
        onPropsChange?.({ backgroundImageId: picture.id });
        setShowBgImagePicker(false);
    }, [onPropsChange]);

    const handleTogglePlay = useCallback(() => {
        const v = videoRef.current;
        if (!v) return;
        if (v.paused) { v.play(); setIsPaused(false); }
        else { v.pause(); setIsPaused(true); }
    }, []);

    const ensureButtons = useCallback((): ButtonConfig[] => {
        if (Array.isArray(buttons)) return buttons;
        try { return JSON.parse(buttons as any) || []; } catch { return []; }
    }, [buttons]);

    const handleAddButton = useCallback(() => {
        const current = ensureButtons();
        const newBtn: ButtonConfig = {
            id: `btn-${Date.now()}`,
            label: translate('New Button'),
        };
        onPropsChange?.({ buttons: [...current, newBtn] });
    }, [ensureButtons, onPropsChange]);

    const handleRemoveButton = useCallback((id: string) => {
        const current = ensureButtons();
        onPropsChange?.({ buttons: current.filter(b => b.id !== id) });
    }, [ensureButtons, onPropsChange]);

    const handleButtonLabelChange = useCallback((id: string, label: string) => {
        const current = ensureButtons();
        onPropsChange?.({ buttons: current.map(b => b.id === id ? { ...b, label } : b) });
    }, [ensureButtons, onPropsChange]);

    const handlePageSelect = useCallback((page: any) => {
        if (!editingButtonId) return;
        const current = ensureButtons();
        const updated = current.map(b =>
            b.id === editingButtonId
                ? {
                    ...b,
                    targetPageId: page?.id || undefined,
                    targetPageSlug: page?.slug || undefined,
                    targetPageOwner: page?.user_id || undefined,
                    href: page ? `/user/${page.user_id}/pages/${page.slug}` : undefined,
                }
                : b
        );
        onPropsChange?.({ buttons: updated });
        setShowPagePicker(false);
        setEditingButtonId(null);
    }, [editingButtonId, ensureButtons, onPropsChange]);

    // Normalize URLs: records written during local dev may contain
    // http://localhost:3333 — replace any host with the configured base.
    // Supabase bucket URLs are proxied through the server's image render API.
    const rewriteUrl = (url: string): string => {
        if (!url) return url;
        const serverBase = serverUrl;
        if (!serverBase) return url;
        const apiIdx = url.indexOf('/api/');
        if (apiIdx !== -1) return `${serverBase}${url.slice(apiIdx)}`;
        // Supabase bucket URL → proxy through server render endpoint
        if (url.includes('supabase.co/storage/')) {
            return `${serverBase}/api/images/render?url=${encodeURIComponent(url)}`;
        }
        return url;
    };

    // Derive URLs
    const effectiveBgImageUrl = rewriteUrl(bgImageInfo?.url || '');
    const effectivePosterUrl = rewriteUrl(posterInfo?.url || videoInfo?.posterUrl || '');
    const effectiveVideoUrl = rewriteUrl(videoInfo?.playbackUrl || '');
    // Background priority: video > background image > poster
    const effectiveBgUrl = effectiveBgImageUrl || effectivePosterUrl;
    const effectiveBgData = bgImageInfo?.responsive || posterInfo?.responsive || videoInfo?.responsive;
    const fitClass = objectFit === 'contain' ? 'object-contain' : 'object-cover';

    const opacityMap = {
        light: 'bg-black/10 dark:bg-black/40',
        medium: 'bg-black/20 dark:bg-black/60',
        dark: 'bg-black/40 dark:bg-black/70',
    };

    const btns = ensureButtons();

    return (
        <>
            <div
                className={cn(
                    "relative flex flex-col justify-end overflow-hidden bg-gray-100 dark:bg-gray-900",
                )}
                style={{
                    minHeight: `${minHeight}px`,
                    maxHeight: '80vh',
                }}
            >
                {/* Background Image (static bg or poster fallback) */}
                {effectiveBgUrl && (
                    <div className="absolute inset-0 w-full h-full">
                        <ResponsiveImage
                            src={effectiveBgUrl}
                            alt={heading || bgImageInfo?.title || posterInfo?.title || 'Banner'}
                            className="w-full h-full"
                            imgClassName={`w-full h-full ${fitClass} object-center`}
                            sizes="100vw"
                            responsiveSizes={[640, 1024, 1280, 1920]}
                            data={effectiveBgData}
                        />
                    </div>
                )}

                {/* Video */}
                {effectiveVideoUrl && (
                    <video
                        ref={videoRef}
                        className="absolute inset-0 w-full h-full object-cover"
                        src={effectiveVideoUrl}
                        poster={effectivePosterUrl || undefined}
                        preload="metadata"
                        autoPlay
                        muted
                        loop
                        playsInline
                        aria-hidden="true"
                    />
                )}

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

                {/* Pause/Play toggle (WCAG 2.2.2) */}
                {effectiveVideoUrl && (
                    <button
                        onClick={handleTogglePlay}
                        className="absolute top-3 right-3 z-20 bg-black/40 hover:bg-black/60 text-white rounded-full w-9 h-9 flex items-center justify-center text-sm transition-colors"
                        aria-label={translate('Pause or play background video')}
                        title={translate('Pause/Play video')}
                    >
                        {isPaused ? '▶' : '⏸'}
                    </button>
                )}

                {/* Edit Mode Overlays */}
                {isEditMode && (
                    <div className="absolute top-3 left-3 z-20 flex gap-2 flex-wrap">
                        <Button
                            size="sm"
                            variant="secondary"
                            className="bg-black/50 hover:bg-black/70 text-white border-0"
                            onClick={() => setShowVideoPicker(true)}
                        >
                            <Video className="h-3.5 w-3.5 mr-1.5" />
                            {videoId ? translate('Change Video') : translate('Pick Video')}
                        </Button>
                        <Button
                            size="sm"
                            variant="secondary"
                            className="bg-black/50 hover:bg-black/70 text-white border-0"
                            onClick={() => setShowBgImagePicker(true)}
                        >
                            <ImageIcon className="h-3.5 w-3.5 mr-1.5" />
                            {backgroundImageId ? translate('Change Image') : translate('Pick Image')}
                        </Button>
                        {videoId && (
                            <Button
                                size="sm"
                                variant="secondary"
                                className="bg-black/50 hover:bg-black/70 text-white border-0"
                                onClick={() => setShowPosterPicker(true)}
                            >
                                <ImageIcon className="h-3.5 w-3.5 mr-1.5" />
                                {posterImageId ? translate('Change Poster') : translate('Pick Poster')}
                            </Button>
                        )}
                    </div>
                )}

                {/* Content pane */}
                <div className="relative z-10 w-full pt-16 sm:pt-20 pb-4 sm:pb-6">
                    <div className={cn(opacityMap[overlayOpacity], "px-5 sm:px-8 lg:px-10 py-6 sm:py-8")}>
                        {/* Heading */}
                        {isEditMode ? (
                            <input
                                type="text"
                                value={heading}
                                onChange={(e) => onPropsChange?.({ heading: e.target.value })}
                                placeholder={translate('Enter heading...')}
                                className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white drop-shadow-lg max-w-4xl w-full bg-transparent border-0 border-b border-white/30 focus:border-white/60 outline-none placeholder-white/40 pb-1"
                            />
                        ) : heading ? (
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white drop-shadow-lg max-w-4xl">
                                <T>{heading}</T>
                            </h1>
                        ) : null}

                        {/* Description */}
                        {isEditMode ? (
                            <textarea
                                value={description}
                                onChange={(e) => onPropsChange?.({ description: e.target.value })}
                                placeholder={translate('Enter description...')}
                                rows={2}
                                className="mt-2 sm:mt-3 text-sm sm:text-base lg:text-lg text-gray-200 drop-shadow max-w-3xl w-full bg-transparent border-0 border-b border-white/30 focus:border-white/60 outline-none placeholder-white/40 resize-none"
                            />
                        ) : description ? (
                            <p className="mt-2 sm:mt-3 text-sm sm:text-base lg:text-lg text-gray-200 drop-shadow max-w-3xl">
                                <T>{description}</T>
                            </p>
                        ) : null}

                        {/* Buttons */}
                        {(btns.length > 0 || isEditMode) && (
                            <div className="mt-4 sm:mt-5 flex flex-col sm:flex-row sm:space-x-4 space-y-3 sm:space-y-0 flex-wrap items-start">
                                {btns.map((btn, i) => (
                                    <div key={btn.id} className="flex items-center gap-1">
                                        {isEditMode ? (
                                            <>
                                                <input
                                                    type="text"
                                                    value={btn.label}
                                                    onChange={(e) => handleButtonLabelChange(btn.id, e.target.value)}
                                                    className="inline-block text-center bg-white/20 border border-white/30 text-white font-semibold py-2 px-4 rounded-md text-sm bg-transparent outline-none min-w-[80px]"
                                                />
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-7 w-7 text-white hover:bg-white/20"
                                                    onClick={() => { setEditingButtonId(btn.id); setShowPagePicker(true); }}
                                                    title={btn.href || translate('Pick target page')}
                                                >
                                                    <FileText className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-7 w-7 text-red-300 hover:text-red-400 hover:bg-red-500/20"
                                                    onClick={() => handleRemoveButton(btn.id)}
                                                    title={translate('Remove button')}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </>
                                        ) : (
                                            <a
                                                href={btn.href || '#'}
                                                className={cn(
                                                    "inline-block text-center font-semibold py-2.5 sm:py-2 px-5 rounded-md transition-colors",
                                                    i === 0
                                                        ? "bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white"
                                                        : "bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/30 text-white"
                                                )}
                                            >
                                                <T>{btn.label}</T>
                                            </a>
                                        )}
                                    </div>
                                ))}

                                {/* Add button control */}
                                {isEditMode && (
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-white/60 hover:text-white hover:bg-white/20 border border-dashed border-white/30"
                                        onClick={handleAddButton}
                                    >
                                        <Plus className="h-3.5 w-3.5 mr-1" />
                                        <T>Add Button</T>
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Empty state for edit mode */}
                {isEditMode && !effectiveVideoUrl && !effectiveBgUrl && (
                    <div className="absolute inset-0 flex items-center justify-center z-5">
                        <div className="text-white/50 text-center">
                            <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p className="text-sm"><T>Pick a background video or image</T></p>
                        </div>
                    </div>
                )}
            </div>

            {/* Reduced-motion: hide video */}
            <style>{`
        @media (prefers-reduced-motion: reduce) {
          video { display: none !important; }
        }
      `}</style>

            {/* Video Picker Dialog */}
            {showVideoPicker && (
                <ImagePickerDialog
                    isOpen={showVideoPicker}
                    onClose={() => setShowVideoPicker(false)}
                    onSelectPicture={handleVideoSelect}
                    currentValue={videoId}
                    typeFilter="video-intern"
                />
            )}

            {/* Background Image Picker Dialog */}
            {showBgImagePicker && (
                <ImagePickerDialog
                    isOpen={showBgImagePicker}
                    onClose={() => setShowBgImagePicker(false)}
                    onSelectPicture={handleBgImageSelect}
                    currentValue={backgroundImageId}
                />
            )}

            {/* Poster Image Picker Dialog */}
            {showPosterPicker && (
                <ImagePickerDialog
                    isOpen={showPosterPicker}
                    onClose={() => setShowPosterPicker(false)}
                    onSelectPicture={handlePosterSelect}
                    currentValue={posterImageId}
                />
            )}

            {/* Page Picker Dialog for buttons */}
            {showPagePicker && (
                <PagePickerDialog
                    isOpen={showPagePicker}
                    onClose={() => { setShowPagePicker(false); setEditingButtonId(null); }}
                    onSelect={handlePageSelect}
                    currentValue={btns.find(b => b.id === editingButtonId)?.targetPageId || null}
                />
            )}
        </>
    );
};

export default VideoBannerWidget;
