import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import VideoCard from "@/components/VideoCard";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, AlertCircle, CheckCircle2, Image as ImageIcon, Upload } from "lucide-react";
// Import from updated video-router
import { generateVideo, AVAILABLE_VIDEO_MODELS, VideoGenerationOptions } from "@/lib/video-router";
import { ImagePickerDialog } from "@/components/widgets/ImagePickerDialog";
import { fetchPictureById } from "@/modules/posts/client-pictures";
import { VideoSettingsControls } from "@/components/video/VideoSettingsControls";

const VideoGenPlayground = () => {
    const { user } = useAuth();
    const [prompt, setPrompt] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
    const [referenceImages, setReferenceImages] = useState<{ url: string, file?: File }[]>([]);
    const [firstFrameImage, setFirstFrameImage] = useState<{ url: string, file?: File } | null>(null);
    const [lastFrameImage, setLastFrameImage] = useState<{ url: string, file?: File } | null>(null);
    const [showImagePicker, setShowImagePicker] = useState(false);
    const [imagePickerTarget, setImagePickerTarget] = useState<'reference' | 'first' | 'last'>('reference');

    // New state for model and options
    const [selectedModel, setSelectedModel] = useState<string>(() => {
        return localStorage.getItem('video-gen-model') || AVAILABLE_VIDEO_MODELS[0].modelName;
    });

    const [videoOptions, setVideoOptions] = useState<VideoGenerationOptions>(() => {
        const saved = localStorage.getItem('video-gen-options');
        return saved ? JSON.parse(saved) : {};
    });

    // Persist settings
    React.useEffect(() => {
        localStorage.setItem('video-gen-model', selectedModel);
    }, [selectedModel]);

    React.useEffect(() => {
        localStorage.setItem('video-gen-options', JSON.stringify(videoOptions));
    }, [videoOptions]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleGenerate = async () => {
        if (!prompt) {
            toast.error("Please enter a prompt");
            return;
        }

        setIsGenerating(true);
        setGeneratedVideoUrl(null);

        try {
            const imageInputs = [];

            for (const img of referenceImages) {
                let base64 = '';
                let mimeType = '';

                if (img.file) {
                    base64 = await new Promise<string>((resolve) => {
                        const reader = new FileReader();
                        reader.onload = (e) => resolve((e.target?.result as string).split(',')[1]);
                        reader.readAsDataURL(img.file!);
                    });
                    mimeType = img.file.type;
                } else if (img.url) {
                    try {
                        const res = await fetch(img.url);
                        const blob = await res.blob();
                        base64 = await new Promise<string>((resolve) => {
                            const reader = new FileReader();
                            reader.onload = (e) => resolve((e.target?.result as string).split(',')[1]);
                            reader.readAsDataURL(blob);
                        });
                        mimeType = blob.type;
                    } catch (e) {
                        console.error("Failed to fetch image from URL", e);
                        // Continue? or fail?
                    }
                }

                if (base64) {
                    imageInputs.push({ imageBytes: base64, mimeType });
                } else {
                    console.warn(`[VideoGenPlayground] Failed to get base64 for image ${img.url}`);
                }
            }

            toast.info(`Starting video generation with ${selectedModel}... This may take a minute.`);

            // Convert first/last frame images to base64 for interpolation
            const optionsWithFrames = { ...videoOptions };
            if (firstFrameImage) {
                const img = firstFrameImage;
                let base64 = '';
                let mimeType = '';
                if (img.file) {
                    base64 = await new Promise<string>((resolve) => {
                        const reader = new FileReader();
                        reader.onload = (e) => resolve((e.target?.result as string).split(',')[1]);
                        reader.readAsDataURL(img.file!);
                    });
                    mimeType = img.file.type;
                } else if (img.url) {
                    const res = await fetch(img.url);
                    const blob = await res.blob();
                    base64 = await new Promise<string>((resolve) => {
                        const reader = new FileReader();
                        reader.onload = (e) => resolve((e.target?.result as string).split(',')[1]);
                        reader.readAsDataURL(blob);
                    });
                    mimeType = blob.type;
                }
                if (base64) optionsWithFrames.firstImage = { imageBytes: base64, mimeType };
            }
            if (lastFrameImage) {
                const img = lastFrameImage;
                let base64 = '';
                let mimeType = '';
                if (img.file) {
                    base64 = await new Promise<string>((resolve) => {
                        const reader = new FileReader();
                        reader.onload = (e) => resolve((e.target?.result as string).split(',')[1]);
                        reader.readAsDataURL(img.file!);
                    });
                    mimeType = img.file.type;
                } else if (img.url) {
                    const res = await fetch(img.url);
                    const blob = await res.blob();
                    base64 = await new Promise<string>((resolve) => {
                        const reader = new FileReader();
                        reader.onload = (e) => resolve((e.target?.result as string).split(',')[1]);
                        reader.readAsDataURL(blob);
                    });
                    mimeType = blob.type;
                }
                if (base64) optionsWithFrames.lastImage = { imageBytes: base64, mimeType };
            }

            const result = await generateVideo(prompt, imageInputs.length > 0 ? imageInputs : undefined, selectedModel, optionsWithFrames);

            if (result.videoUrl) {
                setGeneratedVideoUrl(result.videoUrl);
                toast.success("Video generated successfully!");
            }

        } catch (error: any) {
            console.error("Video generation error:", error);
            toast.error(`Generation failed: ${error.message}`);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            if (referenceImages.length >= 3) {
                toast.error("Max 3 reference images allowed");
                return;
            }
            const file = e.target.files[0];
            setReferenceImages(prev => [...prev, { url: URL.createObjectURL(file), file }]);
        }
    };

    const handleImageSelect = async (pictureId: string) => {
        setShowImagePicker(false);

        const data = await fetchPictureById(pictureId);
        if (!data) return;

        if (imagePickerTarget === 'first') {
            setFirstFrameImage({ url: data.image_url });
        } else if (imagePickerTarget === 'last') {
            setLastFrameImage({ url: data.image_url });
        } else {
            if (referenceImages.length >= 3) {
                toast.error("Max 3 reference images allowed");
                return;
            }
            setReferenceImages(prev => [...prev, { url: data.image_url }]);
        }
    };

    const removeImage = (index: number) => {
        setReferenceImages(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold">Video Generation Playground</h1>
                <p className="text-muted-foreground">
                    Generate videos using Google Veo models. Configure detailed parameters below.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Generation Settings</CardTitle>
                        <CardDescription>Configure your video generation</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">

                        <VideoSettingsControls
                            modelName={selectedModel}
                            onModelChange={setSelectedModel}
                            settings={videoOptions}
                            onSettingsChange={setVideoOptions}
                            disabled={isGenerating}
                        />

                        <div className="space-y-2">
                            <Label>Prompt</Label>
                            <Textarea
                                placeholder="Describe the video you want to generate..."
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                rows={4}
                                disabled={isGenerating}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Reference Images (Optional, Max 3)</Label>
                            <div className="space-y-4">
                                <div className="grid grid-cols-3 gap-2">
                                    {referenceImages.map((img, idx) => (
                                        <div key={idx} className="relative aspect-video w-full overflow-hidden rounded-md border group">
                                            <img src={img.url} alt={`Reference ${idx + 1}`} className="object-cover w-full h-full" />
                                            <Button
                                                variant="destructive"
                                                size="icon"
                                                className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => removeImage(idx)}
                                                disabled={isGenerating}
                                            >
                                                <AlertCircle className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    ))}
                                    {referenceImages.length < 3 && (
                                        <div className="aspect-video w-full border-2 border-dashed rounded-md flex items-center justify-center text-muted-foreground text-xs p-2">
                                            {3 - referenceImages.length} slots left
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isGenerating || referenceImages.length >= 3}
                                    >
                                        <Upload className="mr-2 h-4 w-4" />
                                        Upload Image
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => { setImagePickerTarget('reference'); setShowImagePicker(true); }}
                                        disabled={isGenerating || referenceImages.length >= 3}
                                    >
                                        <ImageIcon className="mr-2 h-4 w-4" />
                                        Pick from Library
                                    </Button>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* First / Last Frame (Interpolation) */}
                        <div className="space-y-2">
                            <Label>First & Last Frame (Interpolation)</Label>
                            <p className="text-xs text-muted-foreground">Set starting and ending frames. The model will animate between them.</p>
                            <div className="grid grid-cols-2 gap-3">
                                {/* First Frame */}
                                <div className="space-y-1.5">
                                    <span className="text-xs font-medium text-muted-foreground">First Frame</span>
                                    {firstFrameImage ? (
                                        <div className="relative aspect-video w-full overflow-hidden rounded-md border group">
                                            <img src={firstFrameImage.url} alt="First frame" className="object-cover w-full h-full" />
                                            <Button
                                                variant="destructive"
                                                size="icon"
                                                className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => setFirstFrameImage(null)}
                                                disabled={isGenerating}
                                            >
                                                <AlertCircle className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex gap-1">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1 text-xs"
                                                onClick={() => {
                                                    const input = document.createElement('input');
                                                    input.type = 'file';
                                                    input.accept = 'image/*';
                                                    input.onchange = (e) => {
                                                        const file = (e.target as HTMLInputElement).files?.[0];
                                                        if (file) setFirstFrameImage({ url: URL.createObjectURL(file), file });
                                                    };
                                                    input.click();
                                                }}
                                                disabled={isGenerating}
                                            >
                                                <Upload className="h-3 w-3 mr-1" /> Upload
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1 text-xs"
                                                onClick={() => { setImagePickerTarget('first'); setShowImagePicker(true); }}
                                                disabled={isGenerating}
                                            >
                                                <ImageIcon className="h-3 w-3 mr-1" /> Library
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                {/* Last Frame */}
                                <div className="space-y-1.5">
                                    <span className="text-xs font-medium text-muted-foreground">Last Frame</span>
                                    {lastFrameImage ? (
                                        <div className="relative aspect-video w-full overflow-hidden rounded-md border group">
                                            <img src={lastFrameImage.url} alt="Last frame" className="object-cover w-full h-full" />
                                            <Button
                                                variant="destructive"
                                                size="icon"
                                                className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => setLastFrameImage(null)}
                                                disabled={isGenerating}
                                            >
                                                <AlertCircle className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex gap-1">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1 text-xs"
                                                onClick={() => {
                                                    const input = document.createElement('input');
                                                    input.type = 'file';
                                                    input.accept = 'image/*';
                                                    input.onchange = (e) => {
                                                        const file = (e.target as HTMLInputElement).files?.[0];
                                                        if (file) setLastFrameImage({ url: URL.createObjectURL(file), file });
                                                    };
                                                    input.click();
                                                }}
                                                disabled={isGenerating}
                                            >
                                                <Upload className="h-3 w-3 mr-1" /> Upload
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1 text-xs"
                                                onClick={() => { setImagePickerTarget('last'); setShowImagePicker(true); }}
                                                disabled={isGenerating}
                                            >
                                                <ImageIcon className="h-3 w-3 mr-1" /> Library
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <Button
                            onClick={handleGenerate}
                            disabled={isGenerating || !prompt}
                            className="w-full"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Generating with {AVAILABLE_VIDEO_MODELS.find(m => m.modelName === selectedModel)?.displayName}...
                                </>
                            ) : (
                                'Generate Video'
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {/* Preview Panel */}
                <Card>
                    <CardHeader>
                        <CardTitle>Result</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {generatedVideoUrl ? (
                            <VideoCard
                                videoId="generated-preview"
                                videoUrl={generatedVideoUrl}
                                title={prompt.slice(0, 50)}
                                author={user?.email || 'User'}
                                authorId={user?.id || 'uid'}
                                likes={0}
                                comments={0}
                                description={prompt}
                                showPlayButton={true}
                            />
                        ) : isGenerating ? (
                            <div className="flex flex-col items-center justify-center h-64 bg-muted rounded-lg border-2 border-dashed">
                                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                                <p className="text-muted-foreground">Generating your video...</p>
                                <p className="text-xs text-muted-foreground mt-2">This usually takes about 30-60 seconds</p>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-64 bg-muted rounded-lg border-2 border-dashed">
                                <p className="text-muted-foreground">Generated video will appear here</p>
                            </div>
                        )}

                        {generatedVideoUrl && (
                            <div className="mt-4 p-4 bg-muted/50 rounded-lg text-xs font-mono break-all">
                                URL: {generatedVideoUrl}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <ImagePickerDialog
                isOpen={showImagePicker}
                onClose={() => setShowImagePicker(false)}
                onSelect={handleImageSelect}
            />
        </div>
    );
};

export default VideoGenPlayground;
