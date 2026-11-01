import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles, X, Image as ImageIcon } from 'lucide-react';
import { T, translate } from '@/i18n';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ModelSelector } from '@/modules/ai/images/components';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImagePickerDialog } from '@/components/widgets/ImagePickerDialog';
import { Switch } from '@/components/ui/switch';
import { Plus } from 'lucide-react';

interface AIImagePromptPopupProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (prompt: string, provider: string, model: string, aspectRatio: string, contextMode: 'selection' | 'content' | 'none', referenceImages?: string[], applicationMode?: 'replace' | 'insert' | 'append', resolution?: string, searchGrounding?: boolean, imageSearch?: boolean) => Promise<void>;
    initialProvider?: string;
    initialModel?: string;
    hasSelection: boolean;
    hasContent: boolean;
}

export const AIImagePromptPopup: React.FC<AIImagePromptPopupProps> = ({
    isOpen,
    onClose,
    onGenerate,
    initialProvider = 'google',
    initialModel = 'gemini-3-pro-image-preview',
    hasSelection,
    hasContent
}) => {
    const [prompt, setPrompt] = useState('');

    // Initialize model from local storage or props
    // Note: Provider is now implicit in the model string for ModelSelector
    const [model, setModel] = useState(() => {
        const storedModel = localStorage.getItem('ai_image_last_model');
        // If stored model already has provider prefix (modern format)
        if (storedModel && storedModel.includes('/')) return storedModel;

        // Migration: Check for legacy separate provider/model
        const storedProvider = localStorage.getItem('ai_image_last_provider');
        if (storedModel && storedProvider) {
            return `${storedProvider}/${storedModel}`;
        }

        return `${initialProvider}/${initialModel}`;
    });

    const [aspectRatio, setAspectRatio] = useState(() => {
        return localStorage.getItem('ai_image_last_aspect_ratio') || '1:1';
    });

    const [resolution, setResolution] = useState(() => {
        return localStorage.getItem('ai_image_last_resolution') || '1K';
    });

    const [searchGrounding, setSearchGrounding] = useState(() => {
        return localStorage.getItem('ai_image_last_grounding') === 'true';
    });

    const [imageSearch, setImageSearch] = useState(() => {
        return localStorage.getItem('ai_image_last_image_search') === 'true';
    });

    const [isGenerating, setIsGenerating] = useState(false);
    const [contextMode, setContextMode] = useState<'selection' | 'content' | 'none'>('none');
    const [applicationMode, setApplicationMode] = useState<'replace' | 'insert' | 'append'>('append');
    // History state
    const [history, setHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    // Reference Images State
    const [referenceImages, setReferenceImages] = useState<any[]>([]);
    const [showImagePicker, setShowImagePicker] = useState(false);

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Save model/aspect ratio changes
    useEffect(() => {
        if (model) localStorage.setItem('ai_image_last_model', model);
    }, [model]);

    useEffect(() => {
        if (aspectRatio) localStorage.setItem('ai_image_last_aspect_ratio', aspectRatio);
    }, [aspectRatio]);

    useEffect(() => {
        if (resolution) localStorage.setItem('ai_image_last_resolution', resolution);
    }, [resolution]);

    useEffect(() => {
        localStorage.setItem('ai_image_last_grounding', String(searchGrounding));
    }, [searchGrounding]);

    useEffect(() => {
        localStorage.setItem('ai_image_last_image_search', String(imageSearch));
    }, [imageSearch]);

    // Initial context mode selection
    useEffect(() => {
        if (isOpen) {
            if (hasSelection) {
                setContextMode('selection');
                setApplicationMode('replace');
            } else if (hasContent) {
                setContextMode('content');
                setApplicationMode('append');
            } else {
                setContextMode('none');
                setApplicationMode('insert');
            }

            // Load history from local storage
            const savedHistory = localStorage.getItem('ai_image_prompt_history');
            if (savedHistory) {
                try {
                    setHistory(JSON.parse(savedHistory));
                } catch (e) { console.error('Failed to parse history', e); }
            }
        }
    }, [isOpen, hasSelection, hasContent]);


    // Auto-focus textarea when opened
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => {
                textareaRef.current?.focus();
            }, 50);
        }
    }, [isOpen]);

    // Handle ESC key to close
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;
            if (e.key === 'Escape') {
                if (!isGenerating) {
                    onClose();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose, isGenerating]);

    const addToHistory = (text: string) => {
        const newHistory = [text, ...history.filter(h => h !== text)].slice(0, 50);
        setHistory(newHistory);
        localStorage.setItem('ai_image_prompt_history', JSON.stringify(newHistory));
        setHistoryIndex(-1);
    };

    const handleGenerate = async () => {
        if (!prompt.trim()) return;

        setIsGenerating(true);
        addToHistory(prompt);
        try {
            // Split provider/model from the model string if possible, or pass as is depending on backend expectation
            // The previous code passed explicit provider "google" or "replicate" etc.
            // ModelSelector returns "provider/modelname".
            // We need to parse it for the callback which expects separate args, OR update callback. 
            // The callback signature in props is: (prompt, provider, model, ...)
            const [providerName, modelName] = model.includes('/') ? model.split(/\/(.+)/) : ['google', model];

            await onGenerate(
                prompt,
                providerName,
                modelName,
                aspectRatio,
                contextMode,
                referenceImages.map(img => img.image_url || img.src),
                applicationMode,
                resolution,
                searchGrounding,
                imageSearch
            );
            onClose();
            setPrompt('');
        } catch (error) {
            console.error("Generation failed", error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        console.log(e.key);
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleGenerate();
        } else if (e.key === 'ArrowUp' && e.ctrlKey) {
            e.preventDefault();
            const nextIndex = Math.min(historyIndex + 1, history.length - 1);
            if (nextIndex !== historyIndex && history[nextIndex]) {
                setHistoryIndex(nextIndex);
                setPrompt(history[nextIndex]);
            }
        } else if (e.key === 'ArrowDown' && e.ctrlKey) {
            e.preventDefault();
            const prevIndex = Math.max(historyIndex - 1, -1);
            if (prevIndex !== historyIndex) {
                setHistoryIndex(prevIndex);
                setPrompt(prevIndex === -1 ? '' : history[prevIndex]);
            }
        }
    };

    // Helper to check if model supports advanced options
    // All Google models in our router support these parameters
    const isGoogleModel = model.startsWith('google/');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <Card className="w-[500px] max-w-[90vw] p-0 overflow-hidden shadow-2xl glass-card border-slate-200/50 dark:border-slate-700/50 bg-white/90 dark:bg-slate-900/90 ring-1 ring-slate-900/5">
                {/* Header */}
                <div className="flex items-center justify-between p-3 border-b border-border/50 bg-muted/30">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground/80">
                        <ImageIcon className="w-4 h-4 text-purple-500" />
                        <T>Generate Image</T>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 rounded-full hover:bg-destructive/10 hover:text-destructive"
                        onClick={onClose}
                        disabled={isGenerating}
                    >
                        <X className="w-3 h-3" />
                    </Button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">
                    {/* Prompt Input */}
                    <div className="relative">
                        <Textarea
                            ref={textareaRef}
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={translate("Describe the image you want to generate...")}
                            className="min-h-[100px] resize-none bg-background/50 focus:bg-background transition-colors text-base"
                            disabled={isGenerating}
                        />
                        {history.length > 0 && (
                            <div className="absolute top-2 right-2 text-[10px] text-muted-foreground opacity-50 pointer-events-none">
                                Ctrl+↑ for history
                            </div>
                        )}
                    </div>

                    {/* Context Toggles */}
                    <div className="flex flex-col gap-1.5">
                        <Label className="text-xs text-muted-foreground">Context</Label>
                        <RadioGroup
                            value={contextMode}
                            onValueChange={(val) => setContextMode(val as any)}
                            className="flex flex-row gap-4"
                            disabled={isGenerating}
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="selection" id="img-c-selection" disabled={!hasSelection} />
                                <Label htmlFor="img-c-selection" className={`text-sm font-normal cursor-pointer ${!hasSelection ? 'opacity-50' : ''}`}>
                                    Selection {hasSelection && '✓'}
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="content" id="img-c-content" disabled={!hasContent} />
                                <Label htmlFor="img-c-content" className={`text-sm font-normal cursor-pointer ${!hasContent ? 'opacity-50' : ''}`}>
                                    Content {hasContent && '✓'}
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="none" id="img-c-none" />
                                <Label htmlFor="img-c-none" className="text-sm font-normal cursor-pointer">No Context</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {/* Controls Row: Aspect Ratio & Model & Mode */}
                    <div className="flex flex-col gap-3">
                        {/* Insertion Mode */}
                        <div className="flex flex-col gap-1.5">
                            <Label className="text-xs text-muted-foreground">Insertion Mode</Label>
                            <RadioGroup
                                value={applicationMode}
                                onValueChange={(val) => setApplicationMode(val as any)}
                                className="flex flex-row gap-4"
                                disabled={isGenerating}
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="replace" id="img-r-replace" />
                                    <Label htmlFor="img-r-replace" className="text-sm font-normal cursor-pointer">Replace</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="insert" id="img-r-insert" />
                                    <Label htmlFor="img-r-insert" className="text-sm font-normal cursor-pointer">Insert</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="append" id="img-r-append" />
                                    <Label htmlFor="img-r-append" className="text-sm font-normal cursor-pointer">Append</Label>
                                </div>
                            </RadioGroup>
                        </div>

                        {/* Model Selector */}
                        <div className="space-y-2">
                            <ModelSelector
                                selectedModel={model}
                                onChange={setModel}
                                label="AI Model"
                                showStepNumber={false}
                            />
                        </div>

                        {/* Advanced Options (Conditionally Rendered) */}
                        {isGoogleModel && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground">Aspect Ratio</Label>
                                    <Select value={aspectRatio} onValueChange={setAspectRatio} disabled={isGenerating}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select ratio" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1:1">Square (1:1)</SelectItem>
                                            <SelectItem value="16:9">Landscape (16:9)</SelectItem>
                                            <SelectItem value="4:3">Standard (4:3)</SelectItem>
                                            <SelectItem value="3:4">Portrait (3:4)</SelectItem>
                                            <SelectItem value="9:16">Mobile (9:16)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground">Resolution</Label>
                                    <Select value={resolution} onValueChange={setResolution} disabled={isGenerating}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Resolution" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1K">1K</SelectItem>
                                            <SelectItem value="2K">2K</SelectItem>
                                            <SelectItem value="4K">4K</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}

                        {/* Google Search Grounding */}
                        {isGoogleModel && (
                            <div className="flex items-center justify-between pt-1">
                                <Label htmlFor="search-grounding" className="flex flex-col space-y-0.5 pointer-events-none">
                                    <span className="text-xs font-medium"><T>Grounding with Google Search</T></span>
                                </Label>
                                <Switch
                                    id="search-grounding"
                                    checked={searchGrounding}
                                    onCheckedChange={setSearchGrounding}
                                    disabled={isGenerating}
                                    className="scale-75 origin-right"
                                />
                            </div>
                        )}

                        {/* Google Image Search Grounding */}
                        {isGoogleModel && (
                            <div className="flex items-center justify-between pt-1">
                                <Label htmlFor="image-search" className="flex flex-col space-y-0.5 pointer-events-none">
                                    <span className="text-xs font-medium"><T>Grounding with Google Image Search</T></span>
                                </Label>
                                <Switch
                                    id="image-search"
                                    checked={imageSearch}
                                    onCheckedChange={(checked) => {
                                        setImageSearch(checked);
                                        // Auto-enable search grounding if image search is enabled
                                        if (checked) setSearchGrounding(true);
                                    }}
                                    disabled={isGenerating}
                                    className="scale-75 origin-right"
                                />
                            </div>
                        )}


                        {/* Reference Images Section */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs text-muted-foreground">Reference Images</Label>
                                <span className="text-xs text-muted-foreground">{referenceImages.length} selected</span>
                            </div>

                            {referenceImages.length === 0 ? (
                                <Button
                                    variant="outline"
                                    className="w-full h-16 border-dashed flex flex-col items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-accent/50 transition-all font-normal"
                                    onClick={() => setShowImagePicker(true)}
                                    disabled={isGenerating}
                                >
                                    <ImageIcon className="h-4 w-4 mb-1 opacity-50" />
                                    <span className="text-xs"><T>Add Reference Image</T></span>
                                </Button>
                            ) : (
                                <div className="grid grid-cols-4 gap-2">
                                    {referenceImages.map((img) => (
                                        <div key={img.id} className="relative aspect-square rounded-md overflow-hidden border group bg-muted/30">
                                            <img
                                                src={img.image_url || img.src}
                                                alt={img.title}
                                                className="w-full h-full object-cover"
                                            />
                                            <button
                                                onClick={() => setReferenceImages(prev => prev.filter(i => i.id !== img.id))}
                                                className="absolute top-0.5 right-0.5 p-0.5 bg-black/50 hover:bg-destructive text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                title="Remove"
                                            >
                                                <X className="h-2.5 w-2.5" />
                                            </button>
                                        </div>
                                    ))}
                                    <Button
                                        variant="outline"
                                        className="aspect-square flex flex-col items-center justify-center p-0 border-dashed hover:border-primary hover:text-primary hover:bg-accent/50 transition-all"
                                        onClick={() => setShowImagePicker(true)}
                                        disabled={isGenerating}
                                    >
                                        <Plus className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                </div>
                            )}

                            <ImagePickerDialog
                                isOpen={showImagePicker}
                                onClose={() => setShowImagePicker(false)}
                                multiple={true}
                                currentValues={referenceImages.map(img => img.id)}
                                onMultiSelectPictures={(pictures) => {
                                    setReferenceImages(pictures);
                                    setShowImagePicker(false);
                                }}
                            />
                        </div>

                        {/* Generate Button */}
                        <div className="flex justify-end pt-2">
                            <Button
                                onClick={handleGenerate}
                                disabled={!prompt.trim() || isGenerating}
                                className={`w-full ${isGenerating ? 'opacity-80' : ''} bg-purple-600 hover:bg-purple-700 text-white`}
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        <T>Generating...</T>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4 mr-2" />
                                        <T>Generate Image</T>
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Footer / Status */}
                    {isGenerating && (
                        <div className="px-4 pb-3">
                            <div className="h-1 w-full bg-muted overflow-hidden rounded-full">
                                <div className="h-full bg-purple-500 animate-progress-indeterminateOrigin" />
                            </div>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};
