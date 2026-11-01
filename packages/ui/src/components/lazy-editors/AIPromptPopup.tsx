import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ProviderSelector } from '@/components/filters/ProviderSelector';
import { Loader2, Sparkles, X } from 'lucide-react';
import { T, translate } from '@/i18n';
import { Card } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface AIPromptPopupProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (prompt: string, provider: string, model: string, contextMode: 'selection' | 'content' | 'none', applicationMode: 'replace' | 'insert' | 'append') => Promise<void>;
    initialProvider?: string;
    initialModel?: string;
    hasSelection: boolean;
    hasContent: boolean;
    targetNode?: HTMLElement | null;
}

export const AIPromptPopup: React.FC<AIPromptPopupProps> = ({
    isOpen,
    onClose,
    onGenerate,
    initialProvider = 'openai',
    initialModel = 'gpt-4o',
    hasSelection,
    hasContent
}) => {
    // State with partial persistence
    const [prompt, setPrompt] = useState('');

    // Initialize provider/model from local storage or props
    const [provider, setProvider] = useState(() => {
        return localStorage.getItem('ai_last_provider') || initialProvider;
    });
    const [model, setModel] = useState(() => {
        return localStorage.getItem('ai_last_model') || initialModel;
    });

    const [isGenerating, setIsGenerating] = useState(false);
    const [contextMode, setContextMode] = useState<'selection' | 'content' | 'none'>('none');
    const [applicationMode, setApplicationMode] = useState<'replace' | 'insert' | 'append'>('append');

    // History state
    const [history, setHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Save provider/model changes
    useEffect(() => {
        if (provider) localStorage.setItem('ai_last_provider', provider);
    }, [provider]);

    useEffect(() => {
        if (model) localStorage.setItem('ai_last_model', model);
    }, [model]);

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
            const savedHistory = localStorage.getItem('ai_prompt_history');
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
        localStorage.setItem('ai_prompt_history', JSON.stringify(newHistory));
        setHistoryIndex(-1);
    };

    const handleGenerate = async () => {
        if (!prompt.trim()) return;

        setIsGenerating(true);
        addToHistory(prompt);
        try {
            await onGenerate(prompt, provider, model, contextMode, applicationMode);
            onClose();
            setPrompt('');
        } catch (error) {
            console.error("Generation failed", error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <Card className="w-[500px] max-w-[90vw] p-0 overflow-hidden shadow-2xl glass-card border-slate-200/50 dark:border-slate-700/50 bg-white/90 dark:bg-slate-900/90 ring-1 ring-slate-900/5">
                {/* Header */}
                <div className="flex items-center justify-between p-3 border-b border-border/50 bg-muted/30">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground/80">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <T>AI Assistant</T>
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
                            placeholder={translate("Ask AI to write something... (Enter to generate)")}
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
                                <RadioGroupItem value="selection" id="c-selection" disabled={!hasSelection} />
                                <Label htmlFor="c-selection" className={`text-sm font-normal cursor-pointer ${!hasSelection ? 'opacity-50' : ''}`}>
                                    Selection {hasSelection && '✓'}
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="content" id="c-content" disabled={!hasContent} />
                                <Label htmlFor="c-content" className={`text-sm font-normal cursor-pointer ${!hasContent ? 'opacity-50' : ''}`}>
                                    Content {hasContent && '✓'}
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="none" id="c-none" />
                                <Label htmlFor="c-none" className="text-sm font-normal cursor-pointer">No Context</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {/* Controls Row: Mode Selector & Provider */}
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
                                    <RadioGroupItem value="replace" id="r-replace" />
                                    <Label htmlFor="r-replace" className="text-sm font-normal cursor-pointer">Replace</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="insert" id="r-insert" />
                                    <Label htmlFor="r-insert" className="text-sm font-normal cursor-pointer">Insert</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="append" id="r-append" />
                                    <Label htmlFor="r-append" className="text-sm font-normal cursor-pointer">Append</Label>
                                </div>
                            </RadioGroup>
                        </div>

                        {/* Provider Selector & Generate */}
                        <div className="flex items-center gap-3 mt-1">
                            <div className="flex-1">
                                <ProviderSelector
                                    provider={provider}
                                    model={model}
                                    onProviderChange={setProvider}
                                    onModelChange={setModel}
                                    disabled={isGenerating}
                                    showManagement={false}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Generate Button */}
                    <div className="flex justify-end">
                        <Button
                            onClick={handleGenerate}
                            disabled={!prompt.trim() || isGenerating}
                            className={`w-full ${isGenerating ? 'opacity-80' : ''}`}
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    <T>Working...</T>
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    <T>Generate</T>
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Footer / Status */}
                {isGenerating && (
                    <div className="px-4 pb-3">
                        <div className="h-1 w-full bg-muted overflow-hidden rounded-full">
                            <div className="h-full bg-primary animate-progress-indeterminateOrigin" />
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
};
