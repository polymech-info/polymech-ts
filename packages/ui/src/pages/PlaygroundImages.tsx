import React, { useState, useRef } from 'react';
import ResponsiveImage, { ResponsiveData } from '@/components/ResponsiveImage';
import { BackgroundImage } from '@/components/BackgroundImage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Maximize2, Minimize2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const PlaygroundImages = () => {
    const [urlInput, setUrlInput] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [activeImage, setActiveImage] = useState<string | File | null>(null);
    const [sizesInput, setSizesInput] = useState('[180, 640, 1024]');
    const [formatsInput, setFormatsInput] = useState('["avif", "webp"]');
    const [sizesAttrInput, setSizesAttrInput] = useState('100vw');
    const [loadedSrc, setLoadedSrc] = useState<string>('');
    const [containerWidth, setContainerWidth] = useState<number>(100);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [imageData, setImageData] = useState<ResponsiveData | null>(null);
    const [selectedRegularUrl, setSelectedRegularUrl] = useState<string>('');
    const [isBodyBackground, setIsBodyBackground] = useState(false);
    const stylesRef = useRef<HTMLStyleElement | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleUrlSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (urlInput) {
            setActiveImage(urlInput);
            setSelectedFile(null);
            setRefreshKey(prev => prev + 1);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setActiveImage(file);
            setUrlInput('');
        }
    };

    const getSizes = () => {
        try {
            return JSON.parse(sizesInput);
        } catch {
            return undefined;
        }
    };

    const getFormats = () => {
        try {
            return JSON.parse(formatsInput);
        } catch {
            return undefined;
        }
    };

    const toggleFullscreen = async () => {
        if (!containerRef.current) return;

        if (!document.fullscreenElement) {
            try {
                await containerRef.current.requestFullscreen();
                setIsFullscreen(true);
            } catch (err) {
                console.error("Error attempting to enable fullscreen:", err);
            }
        } else {
            if (document.exitFullscreen) {
                await document.exitFullscreen();
                setIsFullscreen(false);
            }
        }
    };

    // Listen for fullscreen change events (ESC key)
    React.useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    return (
        <div className="container mx-auto py-8 space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Responsive Image Playground</CardTitle>
                    <CardDescription>Test the responsive image service with URLs or local file uploads.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="url-input">Image URL</Label>
                                <form onSubmit={handleUrlSubmit} className="flex gap-2">
                                    <Input
                                        id="url-input"
                                        placeholder="https://example.com/image.jpg"
                                        value={urlInput}
                                        onChange={(e) => setUrlInput(e.target.value)}
                                    />
                                    <Button type="submit">Load</Button>
                                </form>
                            </div>
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-background px-2 text-muted-foreground">Or</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="file-upload">Upload File</Label>
                                <Input
                                    id="file-upload"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="sizes-config">Sizes (JSON array)</Label>
                                <Input
                                    id="sizes-config"
                                    value={sizesInput}
                                    onChange={(e) => setSizesInput(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="formats-config">Formats (JSON array)</Label>
                                <Input
                                    id="formats-config"
                                    value={formatsInput}
                                    onChange={(e) => setFormatsInput(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="sizes-attr">Sizes Attribute (CSS Media)</Label>
                                <Input
                                    id="sizes-attr"
                                    value={sizesAttrInput}
                                    onChange={(e) => setSizesAttrInput(e.target.value)}
                                    placeholder="(max-width: 600px) 100vw, 50vw"
                                />
                            </div>

                            <div className="space-y-2 pt-4 border-t flex items-end gap-4">
                                <div className="flex-1">
                                    <Label>Container Width: {containerWidth}%</Label>
                                    <Slider
                                        value={[containerWidth]}
                                        onValueChange={(vals) => setContainerWidth(vals[0])}
                                        min={10}
                                        max={100}
                                        step={1}
                                        disabled={isFullscreen}
                                    />
                                </div>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={toggleFullscreen}
                                    title="Toggle Fullscreen"
                                >
                                    {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>

                        <div className="flex flex-col items-center justify-center border rounded-lg p-4 bg-muted/20 min-h-[300px]">
                            {activeImage ? (
                                <div className="w-full h-full flex flex-col items-center">
                                    <div className="flex justify-between w-full mb-2">
                                        <p className="text-sm font-medium text-muted-foreground">Result:</p>
                                    </div>

                                    <div
                                        ref={containerRef}
                                        className={`transition - all duration - 200 ease -in -out border - 2 border - dashed border - primary / 20 rounded - lg p - 1 ${isFullscreen ? 'bg-black flex items-center justify-center border-none p-0' : ''} `}
                                        style={{ width: isFullscreen ? '100%' : `${containerWidth}% `, height: isFullscreen ? '100vh' : 'auto' }}
                                    >
                                        <ResponsiveImage
                                            key={refreshKey}
                                            src={activeImage}
                                            alt="Playground test"
                                            className={`rounded shadow - md block ${isFullscreen ? 'max-h-screen w-auto max-w-full' : 'w-full h-auto'} `}
                                            responsiveSizes={getSizes()}
                                            formats={getFormats()}
                                            sizes={sizesAttrInput}
                                            onLoad={(e) => {
                                                const img = e.target as HTMLImageElement;
                                                setLoadedSrc(img.currentSrc);
                                            }}
                                            onDataLoaded={setImageData}
                                        />
                                    </div>

                                    <div className="text-xs text-muted-foreground mt-4 space-y-2 text-center w-full">
                                        <p>Adjust width slider to test responsiveness.</p>
                                        {loadedSrc && (
                                            <div className="p-2 bg-muted rounded border break-all text-left">
                                                <span className="font-bold block mb-1">Currently loaded:</span>
                                                <span className="font-mono text-[10px]">{loadedSrc}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-muted-foreground">Select an image to preview</div>
                            )}
                        </div>
                    </div>

                    {imageData && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Regular Image Tag Preview</CardTitle>
                                <CardDescription>Preview a specific fixed-width version using a standard &lt;img&gt; tag.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex gap-4 items-end">
                                    <div className="space-y-2 flex-1">
                                        <Label>Select Variant</Label>
                                        <Select onValueChange={setSelectedRegularUrl}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a version..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {imageData.sources.flatMap(s =>
                                                    s.srcset.split(', ').map(part => {
                                                        const [url, width] = part.split(' ');
                                                        const key = `${s.type} - ${width || 'original'} `;
                                                        return { key, url, label: `${key} (${url.split('/').pop()?.slice(0, 8)}...)` };
                                                    })
                                                ).map((item) => (
                                                    <SelectItem key={item.key} value={item.url}>
                                                        {item.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                {selectedRegularUrl && (
                                    <div className="border rounded-lg p-4 bg-muted/20 flex flex-col items-center">
                                        <img src={selectedRegularUrl} alt="Regular preview" className="max-w-full h-auto rounded shadow-sm" />
                                        <div className="mt-2 p-2 bg-muted rounded border text-xs break-all w-full">
                                            <code>&lt;img src="{selectedRegularUrl}" /&gt;</code>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    <Card>
                        <CardHeader>
                            <CardTitle>BackgroundImage Component</CardTitle>
                            <CardDescription>Responsive background image with AVIF/WebP support via CSS.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="border rounded-lg p-4 bg-muted/20">
                                <p className="mb-4 text-sm text-muted-foreground">Resize the browser window or inspect elements to verify format switching (requires html class injection).</p>
                                {activeImage && (
                                    <BackgroundImage
                                        src={activeImage}
                                        className="w-full h-[400px] rounded-lg shadow-inner flex items-center justify-center text-white font-bold text-2xl drop-shadow-md border bg-gray-200"
                                        sizes={sizesAttrInput}
                                        responsiveSizes={getSizes()}
                                        formats={getFormats()}
                                    >
                                        Background Content
                                    </BackgroundImage>
                                )}
                                <div className="mt-4 flex justify-end">
                                    <Button
                                        variant={isBodyBackground ? "destructive" : "secondary"}
                                        onClick={() => setIsBodyBackground(!isBodyBackground)}
                                        disabled={!activeImage}
                                    >
                                        {isBodyBackground ? "Remove Body Background" : "Set as Page Background"}
                                    </Button>
                                </div>
                                {!activeImage && <p className="text-muted-foreground">Select an image above to test.</p>}
                            </div>
                        </CardContent>
                    </Card>
                </CardContent>
            </Card>

            {isBodyBackground && activeImage && (
                <BackgroundImage
                    src={activeImage}
                    className="fixed inset-0 z-[-1] min-h-screen w-full"
                    sizes="100vw"
                    responsiveSizes={getSizes()}
                    formats={getFormats()}
                />
            )}
        </div>
    );
};

export default PlaygroundImages;
