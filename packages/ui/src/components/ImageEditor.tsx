
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCw, RotateCcw, Crop as CropIcon, Download, X, Check, Save, Image as ImageIcon, Sliders } from 'lucide-react';
import { updatePicture, transformImage } from '@/modules/posts/client-pictures';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { uploadImage } from '@/lib/uploadUtils';
import { Slider } from '@/components/ui/slider';

interface ImageEditorProps {
    imageUrl: string;
    pictureId: string;
    onSave?: (newUrl: string) => void;
    onClose?: () => void;
}

export const ImageEditor = ({ imageUrl, pictureId, onSave, onClose }: ImageEditorProps) => {
    const [previewUrl, setPreviewUrl] = useState<string | null>(imageUrl);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const { user } = useAuth();
    const imageRef = useRef<HTMLImageElement>(null);

    // Edit State
    const [mode, setMode] = useState<'view' | 'crop' | 'adjust'>('view');
    const [brightness, setBrightness] = useState(1);
    const [contrast, setContrast] = useState(1);

    // Reset adjustments when image changes or mode resets (optional, depends on UX)
    // For now, these are "pending" adjustments locally until applied.

    useEffect(() => {
        setPreviewUrl(imageUrl);
        // Reset local edits on new image
        setBrightness(1);
        setContrast(1);
        setMode('view');
    }, [imageUrl]);

    const executeOperation = async (ops: any[]) => {
        if (!previewUrl) return;

        setLoading(true);
        try {
            const response = await fetch(previewUrl);
            const blob = await response.blob();
            const file = new File([blob], "source.jpg", { type: blob.type });

            const resultUrl = await transformImage(file, ops);

            setPreviewUrl(resultUrl);
            toast({ title: "Applied" });

        } catch (err: any) {
            toast({
                title: "Operation failed",
                description: err.message,
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleRotate = (angle: number) => {
        executeOperation([{ type: 'rotate', angle }]);
    };

    const handleSave = async () => {
        if (!previewUrl || !pictureId || !user) return;
        setLoading(true);

        try {
            const response = await fetch(previewUrl);
            const blob = await response.blob();
            const file = new File([blob], "edited.jpg", { type: "image/jpeg" });

            const { publicUrl } = await uploadImage(file, user.id);

            await updatePicture(pictureId, {
                image_url: publicUrl,
                updated_at: new Date().toISOString()
            });

            toast({ title: "Image Saved", description: "Source image updated successfully." });
            onSave?.(publicUrl);

        } catch (err: any) {
            console.error(err);
            toast({
                title: "Save failed",
                description: err.message,
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    // --- Visual Cropper State ---
    const [cropRect, setCropRect] = useState<{ x: number, y: number, w: number, h: number } | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState<{ x: number, y: number } | null>(null);
    const [dragAction, setDragAction] = useState<'move' | 'nw' | 'ne' | 'sw' | 'se' | 'create' | null>(null);
    const [aspectRatio, setAspectRatio] = useState<number | null>(null);

    const PRESETS = [
        { label: 'Free', value: null },
        { label: 'Original', value: 'original' },
        { label: 'Square', value: 1 },
        { label: '9:16', value: 9 / 16 },
        { label: '16:9', value: 16 / 9 },
        { label: '4:5', value: 4 / 5 },
        { label: '5:4', value: 5 / 4 },
        { label: '3:4', value: 3 / 4 },
        { label: '4:3', value: 4 / 3 },
    ];

    useEffect(() => {
        if (mode === 'crop' && imageRef.current) {
            const { width, height } = imageRef.current.getBoundingClientRect();
            const w = width * 0.8;
            const h = height * 0.8;
            setCropRect({
                x: (width - w) / 2,
                y: (height - h) / 2,
                w, h
            });
        }
    }, [mode]);

    const getPointerPos = (e: React.PointerEvent | PointerEvent) => {
        if (!imageRef.current) return { x: 0, y: 0 };
        const rect = imageRef.current.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    };

    const handlePointerDown = (e: React.PointerEvent) => {
        if (mode !== 'crop' || !cropRect) return;
        e.preventDefault();
        e.stopPropagation();
        // Capture pointer to ensure we get move/up events even if we leave the div
        (e.target as Element).setPointerCapture(e.pointerId);

        const { x, y } = getPointerPos(e);

        const handleSize = 40; // Increased hit area for easier touch
        const r = cropRect;

        if (Math.abs(x - r.x) < handleSize && Math.abs(y - r.y) < handleSize) setDragAction('nw');
        else if (Math.abs(x - (r.x + r.w)) < handleSize && Math.abs(y - r.y) < handleSize) setDragAction('ne');
        else if (Math.abs(x - r.x) < handleSize && Math.abs(y - (r.y + r.h)) < handleSize) setDragAction('sw');
        else if (Math.abs(x - (r.x + r.w)) < handleSize && Math.abs(y - (r.y + r.h)) < handleSize) setDragAction('se');
        else if (x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h) setDragAction('move');
        else setDragAction('create');

        setIsDragging(true);
        setDragStart({ x, y });
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging || !dragStart || !cropRect || !imageRef.current) return;
        const { x, y } = getPointerPos(e);
        const dx = x - dragStart.x;
        const dy = y - dragStart.y;

        const imgW = imageRef.current.offsetWidth;
        const imgH = imageRef.current.offsetHeight;

        setCropRect(prev => {
            if (!prev) return null;
            let next = { ...prev };

            if (dragAction === 'move') {
                next.x = Math.max(0, Math.min(imgW - next.w, prev.x + dx));
                next.y = Math.max(0, Math.min(imgH - next.h, prev.y + dy));
            } else {
                let newW = next.w;
                let newH = next.h;
                let newX = next.x;
                let newY = next.y;

                if (dragAction === 'se') {
                    newW = Math.max(20, prev.w + dx);
                    newH = Math.max(20, prev.h + dy);
                } else if (dragAction === 'sw') {
                    newW = prev.w - dx;
                    newX = Math.min(prev.x + prev.w - 20, prev.x + dx);
                    newH = Math.max(20, prev.h + dy);
                } else if (dragAction === 'ne') {
                    newW = Math.max(20, prev.w + dx);
                    newH = prev.h - dy;
                    newY = Math.min(prev.y + prev.h - 20, prev.y + dy);
                } else if (dragAction === 'nw') {
                    newW = prev.w - dx;
                    newX = Math.min(prev.x + prev.w - 20, prev.x + dx);
                    newH = prev.h - dy;
                    newY = Math.min(prev.y + prev.h - 20, prev.y + dy);
                }

                if (aspectRatio !== null) {
                    if (dragAction === 'se' || dragAction === 'sw') {
                        newH = newW / aspectRatio;
                    } else {
                        newW = newH * aspectRatio;
                        if (dragAction === 'nw') newX = prev.x + prev.w - newW;
                    }
                    newH = newW / aspectRatio;

                    if (dragAction === 'nw') {
                        newY = prev.y + prev.h - newH;
                        newX = prev.x + prev.w - newW;
                    } else if (dragAction === 'ne') {
                        newY = prev.y + prev.h - newH;
                    }
                }

                next.w = Math.max(20, newW);
                next.h = Math.max(20, newH);
                next.x = newX;
                next.y = newY;
            }

            return next;
        });

        setDragStart({ x, y });
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        setIsDragging(false);
        setDragAction(null);
        (e.target as Element).releasePointerCapture(e.pointerId);
    };

    const applyCrop = () => {
        if (!cropRect || !imageRef.current) return;

        const displayRect = imageRef.current.getBoundingClientRect();
        const scaleX = imageRef.current.naturalWidth / displayRect.width;
        const scaleY = imageRef.current.naturalHeight / displayRect.height;

        let realX = Math.round(cropRect.x * scaleX);
        let realY = Math.round(cropRect.y * scaleY);
        let realW = Math.round(cropRect.w * scaleX);
        let realH = Math.round(cropRect.h * scaleY);

        realX = Math.max(0, realX);
        realY = Math.max(0, realY);
        realW = Math.max(1, Math.min(realW, imageRef.current.naturalWidth - realX));
        realH = Math.max(1, Math.min(realH, imageRef.current.naturalHeight - realY));

        const realCrop = {
            x: realX,
            y: realY,
            width: realW,
            height: realH
        };

        executeOperation([{ type: 'crop', ...realCrop }]);
        setMode('view');
    };

    const applyAdjust = () => {
        // Send adjust op
        executeOperation([{
            type: 'adjust',
            brightness: brightness !== 1 ? brightness : undefined,
            contrast: contrast !== 1 ? contrast : undefined
        }]);
        setMode('view');
        // Reset sliders as they are applied to the "base" image now
        setBrightness(1);
        setContrast(1);
    };

    const cancelAdjust = () => {
        setBrightness(1);
        setContrast(1);
        setMode('view');
    };

    const downloadImage = () => {
        if (previewUrl) {
            const a = document.createElement('a');
            a.href = previewUrl;
            a.download = 'edited-image.jpg';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
    };

    return (
        <div className="flex flex-col h-full w-full bg-background relative overflow-hidden">
            {/* Close Button if provided */}
            {onClose && (
                <div className="absolute top-4 right-4 z-20">
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full bg-background/50 hover:bg-background/80">
                        <X className="w-6 h-6" />
                    </Button>
                </div>
            )}

            <div
                className="flex-1 flex items-center justify-center p-8 bg-zinc-950/50 relative select-none touch-none"
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
            >
                {previewUrl ? (
                    <div className="relative group">
                        <img
                            ref={imageRef}
                            src={previewUrl}
                            alt="Work"
                            className="max-h-[80vh] max-w-full object-contain pointer-events-none transition-all duration-200"
                            style={{
                                filter: mode === 'adjust' ? `brightness(${brightness}) contrast(${contrast})` : undefined
                            }}
                            draggable={false}
                            onDragStart={(e) => e.preventDefault()}
                        />

                        {mode === 'crop' && cropRect && (
                            <div
                                className="absolute border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] cursor-move"
                                style={{
                                    left: cropRect.x,
                                    top: cropRect.y,
                                    width: cropRect.w,
                                    height: cropRect.h,
                                    touchAction: 'none'
                                }}
                                onPointerDown={handlePointerDown}
                            >
                                <div className="absolute -top-3 -left-3 w-6 h-6 bg-white border border-black cursor-nw-resize rounded-full shadow-sm" />
                                <div className="absolute -top-3 -right-3 w-6 h-6 bg-white border border-black cursor-ne-resize rounded-full shadow-sm" />
                                <div className="absolute -bottom-3 -left-3 w-6 h-6 bg-white border border-black cursor-sw-resize rounded-full shadow-sm" />
                                <div className="absolute -bottom-3 -right-3 w-6 h-6 bg-white border border-black cursor-se-resize rounded-full shadow-sm" />

                                <div className="absolute top-1/3 left-0 right-0 h-px bg-white/30 pointer-events-none" />
                                <div className="absolute top-2/3 left-0 right-0 h-px bg-white/30 pointer-events-none" />
                                <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/30 pointer-events-none" />
                                <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/30 pointer-events-none" />
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-muted-foreground flex flex-col items-center">
                        <ImageIcon className="w-16 h-16 mb-4 opacity-20" />
                        <p>No image loaded</p>
                    </div>
                )}
            </div>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex flex-col gap-2 items-center w-full max-w-2xl px-4 pointer-events-none">
                {/* Controls Container - enable pointer events for children */}
                <div className="pointer-events-auto flex flex-col gap-2 items-center w-full">
                    {mode === 'crop' && (
                        <div className="bg-background/80 backdrop-blur-md border rounded-full shadow-xl px-2 py-1 flex items-center gap-1 overflow-x-auto max-w-full scrollbar-hide">
                            {PRESETS.map(p => (
                                <Button
                                    key={p.label}
                                    variant={aspectRatio === (p.value === 'original' ? (imageRef.current ? imageRef.current.width / imageRef.current.height : null) : p.value) ? "secondary" : "ghost"}
                                    size="sm"
                                    onClick={() => {
                                        if (p.value === 'original' && imageRef.current) {
                                            setAspectRatio(imageRef.current.width / imageRef.current.height);
                                        } else {
                                            setAspectRatio(p.value as number | null);
                                        }
                                        if (cropRect && imageRef.current) {
                                            const ratio = p.value === 'original' ? (imageRef.current.width / imageRef.current.height) : p.value as number;
                                            if (ratio) {
                                                const newH = cropRect.w / ratio;
                                                setCropRect({ ...cropRect, h: newH });
                                            }
                                        }
                                    }}
                                    className="text-xs h-8 px-2 whitespace-nowrap"
                                >
                                    {p.label}
                                </Button>
                            ))}
                        </div>
                    )}

                    {mode === 'adjust' && (
                        <div className="bg-background/80 backdrop-blur-md border rounded-xl shadow-xl px-4 py-4 w-full max-w-sm space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs font-medium">
                                    <span>Brightness</span>
                                    <span>{Math.round(brightness * 100)}%</span>
                                </div>
                                <Slider
                                    value={[brightness]}
                                    min={0.5}
                                    max={1.5}
                                    step={0.05}
                                    onValueChange={([v]) => setBrightness(v)}
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs font-medium">
                                    <span>Contrast</span>
                                    <span>{Math.round(contrast * 100)}%</span>
                                </div>
                                <Slider
                                    value={[contrast]}
                                    min={0.5}
                                    max={1.5}
                                    step={0.05}
                                    onValueChange={([v]) => setContrast(v)}
                                />
                            </div>
                            <div className="flex justify-end gap-2 mt-2">
                                <Button variant="ghost" size="sm" onClick={cancelAdjust}>Cancel</Button>
                                <Button size="sm" onClick={applyAdjust}>Apply</Button>
                            </div>
                        </div>
                    )}

                    <div className="bg-background/80 backdrop-blur-md border rounded-full shadow-xl px-4 py-2 flex items-center gap-2">
                        {mode === 'view' ? (
                            <>
                                <Button variant="ghost" size="icon" onClick={() => setMode('crop')} title="Crop">
                                    <CropIcon className="w-5 h-5" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => setMode('adjust')} title="Adjust">
                                    <Sliders className="w-5 h-5" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleRotate(-90)} title="Rotate CCW">
                                    <RotateCcw className="w-5 h-5" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleRotate(90)} title="Rotate CW">
                                    <RotateCw className="w-5 h-5" />
                                </Button>
                                <div className="w-px h-6 bg-border mx-1" />
                                <Button variant="ghost" size="icon" onClick={handleSave} disabled={!pictureId} title="Save (Overwrite)">
                                    <Save className="w-5 h-5" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={downloadImage} title="Download">
                                    <Download className="w-5 h-5" />
                                </Button>
                            </>
                        ) : mode === 'crop' ? (
                            <>
                                <Button variant="ghost" size="icon" onClick={() => setMode('view')} className="text-muted-foreground">
                                    <X className="w-5 h-5" />
                                </Button>
                                <span className="text-sm font-medium px-2">Crop Mode</span>
                                <Button variant="default" size="icon" className="rounded-full" onClick={applyCrop}>
                                    <Check className="w-5 h-5" />
                                </Button>
                            </>
                        ) : (
                            // Adjust Mode Toolbar
                            <>
                                <Button variant="ghost" size="icon" onClick={cancelAdjust} className="text-muted-foreground">
                                    <X className="w-5 h-5" />
                                </Button>
                                <span className="text-sm font-medium px-2">Adjust Mode</span>
                                <Button variant="default" size="icon" className="rounded-full" onClick={applyAdjust}>
                                    <Check className="w-5 h-5" />
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>


            {
                loading && (
                    <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-50 backdrop-blur-sm">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                )
            }
        </div >
    );
};
