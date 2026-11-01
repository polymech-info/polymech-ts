
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ImagePickerDialog } from '@/components/widgets/ImagePickerDialog';
import { RotateCw, RotateCcw, Crop as CropIcon, Download, Sliders, Image as ImageIcon, X, Check, Save } from 'lucide-react';
import { fetchPictureById, updatePicture } from '@/modules/posts/client-pictures';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';

import { uploadImage } from '@/lib/uploadUtils';
import { serverUrl } from '@/lib/db';

const PlaygroundImageEditor = () => {
    const [pickerOpen, setPickerOpen] = useState(false);
    const [sourceImage, setSourceImage] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [selectedPictureId, setSelectedPictureId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const { user } = useAuth();

    const containerRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);

    // Edit State
    const [mode, setMode] = useState<'view' | 'crop'>('view');

    // Pending Transformations (applied on Save/Download or incrementally?)
    // For "playground" usually we want immediate feedback, but for crop we need a "mode".
    // Let's accumulate operations.

    // Actually, to keep it simple and robust:
    // 1. Source Image is the "Base".
    // 2. We apply operations to get "Preview".
    // 3. IF we crop, we are defining a rectangle relative to the CURRENT Preview? Or always original?
    //    Standard editors usually work on the "current visual state".
    //    But sending "chain of ops" is cleaner for backend.
    //    Let's try: Maintain a list of operations.
    //    BUT: Cropping visually on a rotated image is hard math-wise if we just pile ops.
    //    Easier: "Apply" an operation => It becomes the new "Source" (conceptually or physically).
    //    Server returns new image -> That becomes new source.
    //    This avoids complex client-side coordinate mapping through rotations.

    const handleSelectImage = async (pictureId: string) => {
        setLoading(true);
        setPickerOpen(false);
        try {
            const data = await fetchPictureById(pictureId);
            if (!data) throw new Error('Picture not found');

            setSelectedPictureId(pictureId);
            setSourceImage(data.image_url);
            setPreviewUrl(data.image_url);
            setMode('view');
        } catch (err: any) {
            toast({
                title: "Error loading image",
                description: err.message,
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const executeOperation = async (ops: any[]) => {
        if (!previewUrl) return; // Use previewUrl as source for next step? Or always keep original source?
        // If we want to support "Undo", we should keep original + ops list.
        // If we want "Apply and Commit", we replace source.
        // Let's go with "Commit immediately" for this simple playground to avoid state hell.
        // So: Current Preview -> Apply Op -> New Preview.

        setLoading(true);
        try {
            // Fetch current preview as blob to send as base
            const response = await fetch(previewUrl);
            const blob = await response.blob();
            const file = new File([blob], "source.jpg", { type: blob.type });

            const formData = new FormData();
            formData.append('file', file);
            formData.append('operations', JSON.stringify(ops));

            const res = await fetch(`${serverUrl}/api/images/transform`, {
                method: 'POST',
                body: formData
            });

            if (!res.ok) throw new Error(await res.text());

            const resultBlob = await res.blob();
            const resultUrl = URL.createObjectURL(resultBlob);

            // Update state
            setPreviewUrl(resultUrl);
            setSourceImage(resultUrl); // Commit functionality

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
        if (!previewUrl || !selectedPictureId || !user) return;
        setLoading(true);

        try {
            // 1. Get blob and convert to File
            const response = await fetch(previewUrl);
            const blob = await response.blob();
            const file = new File([blob], "edited.jpg", { type: "image/jpeg" });

            // 2. Upload using shared utility (handles RLS paths and proxy resizing)
            const { publicUrl } = await uploadImage(file, user.id);

            // 3. Update Database Record
            await updatePicture(selectedPictureId, { image_url: publicUrl } as any);

            setSourceImage(publicUrl);
            toast({ title: "Image Saved", description: "Source image updated successfully." });

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
    const [aspectRatio, setAspectRatio] = useState<number | null>(null); // null = Free

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

    // Initialize crop rect when entering crop mode
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

    const getMousePos = (e: React.MouseEvent | MouseEvent) => {
        if (!imageRef.current) return { x: 0, y: 0 };
        const rect = imageRef.current.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (mode !== 'crop' || !cropRect) return;
        e.preventDefault();
        const { x, y } = getMousePos(e);

        // Check handles first (simplified: corners)
        const handleSize = 20;
        const r = cropRect;

        // Hit testing
        if (Math.abs(x - r.x) < handleSize && Math.abs(y - r.y) < handleSize) setDragAction('nw');
        else if (Math.abs(x - (r.x + r.w)) < handleSize && Math.abs(y - r.y) < handleSize) setDragAction('ne');
        else if (Math.abs(x - r.x) < handleSize && Math.abs(y - (r.y + r.h)) < handleSize) setDragAction('sw');
        else if (Math.abs(x - (r.x + r.w)) < handleSize && Math.abs(y - (r.y + r.h)) < handleSize) setDragAction('se');
        else if (x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h) setDragAction('move');
        else setDragAction('create'); // Click outside to create new? Or just ignore? Let's ignore for now to keep it simple.

        setIsDragging(true);
        setDragStart({ x, y });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !dragStart || !cropRect || !imageRef.current) return;
        const { x, y } = getMousePos(e);
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
                // Resize logic with aspect ratio
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

                // Apply Ratio
                if (aspectRatio !== null) {
                    if (dragAction === 'se' || dragAction === 'sw') {
                        newH = newW / aspectRatio;
                    } else {
                        newW = newH * aspectRatio;
                        if (dragAction === 'nw' || dragAction === 'sw') newX = prev.x + prev.w - newW;
                    }
                    // This simple logic might drift; usually you lock one axis based on dominance
                    // Better: Always drive by Width for horizontalish moves?
                    // Let's stick to simple: if dragging corner, calculate H from W (or vice versa)
                    // For SE/SW (bottom handles), let X/Width drive Height.
                    // For NE/NW (top handles), let Y/Height drive Width (or X/Width drive Y/Height?)
                    // Let's enforce: Width determines Height for all.
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

    const handleMouseUp = () => {
        setIsDragging(false);
        setDragAction(null);
    };

    const applyCrop = () => {
        if (!cropRect || !imageRef.current) return;

        // Calculate actual crop relative to natural image size
        // Visual Rect -> Percentage -> Natural Size
        const displayRect = imageRef.current.getBoundingClientRect();
        const scaleX = imageRef.current.naturalWidth / displayRect.width;
        const scaleY = imageRef.current.naturalHeight / displayRect.height;

        let realX = Math.round(cropRect.x * scaleX);
        let realY = Math.round(cropRect.y * scaleY);
        let realW = Math.round(cropRect.w * scaleX);
        let realH = Math.round(cropRect.h * scaleY);

        // Clamp values to ensure they are within bounds and non-negative
        // Sharp throws error if x/y are negative or if box is outside image
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
        <div className="flex flex-col h-[calc(100vh-4rem)] bg-background relative overflow-hidden">

            {/* Workspace */}
            <div
                className="flex-1 flex items-center justify-center p-8 bg-zinc-950/50 relative select-none"
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                {previewUrl ? (
                    <div className="relative group">
                        <img
                            ref={imageRef}
                            src={previewUrl}
                            alt="Work"
                            className="max-h-[80vh] max-w-full object-contain pointer-events-none"
                            draggable={false}
                            onDragStart={(e) => e.preventDefault()}
                        />

                        {/* Crop Overlay */}
                        {mode === 'crop' && cropRect && (
                            <div
                                className="absolute border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] cursor-move"
                                style={{
                                    left: cropRect.x,
                                    top: cropRect.y,
                                    width: cropRect.w,
                                    height: cropRect.h
                                }}
                                onMouseDown={handleMouseDown}
                            >
                                {/* Crop Handles */}
                                <div className="absolute -top-1 -left-1 w-3 h-3 bg-white border border-black cursor-nw-resize" />
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-white border border-black cursor-ne-resize" />
                                <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-white border border-black cursor-sw-resize" />
                                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-white border border-black cursor-se-resize" />

                                {/* Grid Lines (3x3) */}
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
                        <p>Select an image to start editing</p>
                        <Button variant="outline" className="mt-4" onClick={() => setPickerOpen(true)}>
                            Open Library
                        </Button>
                    </div>
                )}
            </div>

            {/* Floating Toolbar */}
            {previewUrl && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col gap-2 items-center w-full max-w-2xl px-4">
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
                                        // Reset rect to match new ratio? Or just enforce on next drag?
                                        // Usually better to snap immediately.
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

                    <div className="bg-background/80 backdrop-blur-md border rounded-full shadow-xl px-4 py-2 flex items-center gap-2">

                        {mode === 'view' ? (
                            <>
                                <Button variant="ghost" size="icon" onClick={() => setPickerOpen(true)} title="Change Image">
                                    <ImageIcon className="w-5 h-5" />
                                </Button>
                                <div className="w-px h-6 bg-border mx-1" />
                                <Button variant="ghost" size="icon" onClick={() => setMode('crop')} title="Crop">
                                    <CropIcon className="w-5 h-5" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleRotate(-90)} title="Rotate CCW">
                                    <RotateCcw className="w-5 h-5" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleRotate(90)} title="Rotate CW">
                                    <RotateCw className="w-5 h-5" />
                                </Button>
                                <div className="w-px h-6 bg-border mx-1" />
                                <Button variant="ghost" size="icon" onClick={handleSave} disabled={!selectedPictureId} title="Save (Overwrite)">
                                    <Save className="w-5 h-5" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={downloadImage} title="Download">
                                    <Download className="w-5 h-5" />
                                </Button>
                            </>
                        ) : (
                            // Crop Mode Toolbar
                            <>
                                <Button variant="ghost" size="icon" onClick={() => setMode('view')} className="text-muted-foreground">
                                    <X className="w-5 h-5" />
                                </Button>
                                <span className="text-sm font-medium px-2">Crop Mode</span>
                                <Button variant="default" size="icon" className="rounded-full" onClick={applyCrop}>
                                    <Check className="w-5 h-5" />
                                </Button>
                            </>
                        )}

                    </div>
                </div>
            )}

            {loading && (
                <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            )}

            <ImagePickerDialog
                isOpen={pickerOpen}
                onClose={() => setPickerOpen(false)}
                onSelect={handleSelectImage}
            />
        </div>
    );
};

export default PlaygroundImageEditor;
