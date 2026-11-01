import React, { Suspense, lazy } from 'react';
import {
    ArrowUp, ArrowDown, Upload, FileText, Sparkles, Mic, MicOff, Plus, Trash2, Save, History, Wand2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { T, translate } from "@/i18n";
import { ImageLightboxEditorConfig } from './ImageLightboxTypes';

const StylePresetSelector = lazy(() => import('./StylePresetSelector').then(m => ({ default: m.StylePresetSelector })));

export interface EditingToolbarProps {
    config: ImageLightboxEditorConfig;
    onHide: () => void;
}

export function EditingToolbar({ config, onHide }: EditingToolbarProps) {
    const {
        showWizardFeatures,
        lightboxPrompt,
        setLightboxPrompt,
        isGenerating,
        isPublishing,
        isOptimizing,
        isRecording,
        isTranscribing,
        onPromptSubmit,
        onMicrophoneToggle,
        onManualPromptEdit,
        promptTemplates = [],
        onApplyTemplate,
        onSaveTemplate,
        onDeleteTemplate,
        onOptimizePrompt,
        onOpenInWizard,
        onNavigateHistory,
        promptHistory = [],
        historyIndex = -1,
        showPublish,
        showQuickPublish,
        onQuickPublish,
        onPublishClick,
        quickActions = []
    } = config;

    return (
        <div
            className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-[90vw] md:w-[80vw] max-w-4xl z-40"
            onClick={(e) => {
                // Allow clicking outside the prompt container to hide it
                if (e.target === e.currentTarget) {
                    onHide();
                }
            }}
        >
            <div
                className="bg-black/80 backdrop-blur-sm rounded-xl p-3 md:p-4 shadow-2xl border border-white/20"
                onClick={(e) => e.stopPropagation()}
            >
                {showWizardFeatures ? (
                    /* Wizard Mode: Textarea + Separate Actions Row */
                    <>
                        {/* Prompt History Indicator */}
                        {promptHistory.length > 0 && (
                            <div className="flex items-center justify-between mb-2 text-xs">
                                <span className="text-white/60">
                                    History: {historyIndex >= 0 ? `${historyIndex + 1}/${promptHistory.length}` : 'Current'}
                                </span>
                                <div className="flex items-center gap-1">
                                    {/* History Picker Dropdown */}
                                    <DropdownMenu modal={false}>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                onClick={(e) => e.stopPropagation()}
                                                className="h-6 w-6 p-0 text-white hover:text-primary"
                                                title="Browse prompt history"
                                            >
                                                <History className="h-3 w-3" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-80 max-h-64 overflow-y-auto z-[10000]">
                                            {promptHistory.length === 0 ? (
                                                <div className="px-2 py-3 text-sm text-muted-foreground text-center">
                                                    <T>No history yet</T>
                                                </div>
                                            ) : (
                                                <>
                                                    {[...promptHistory].reverse().map((historyPrompt, reverseIndex) => {
                                                        const actualIndex = promptHistory.length - 1 - reverseIndex;
                                                        return (
                                                            <DropdownMenuItem
                                                                key={actualIndex}
                                                                onSelect={() => {
                                                                    setLightboxPrompt(historyPrompt);
                                                                }}
                                                                className={`flex flex-col items-start gap-1 py-2 ${historyIndex === actualIndex ? 'bg-primary/10' : ''
                                                                    }`}
                                                            >
                                                                <div className="text-xs text-muted-foreground">
                                                                    #{promptHistory.length - reverseIndex}
                                                                    {historyIndex === actualIndex && ' (current)'}
                                                                </div>
                                                                <div className="text-sm line-clamp-2 w-full">
                                                                    {historyPrompt}
                                                                </div>
                                                            </DropdownMenuItem>
                                                        );
                                                    })}
                                                </>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onNavigateHistory?.('up');
                                        }}
                                        disabled={promptHistory.length === 0 || historyIndex === promptHistory.length - 1}
                                        className="h-6 w-6 p-0 text-white hover:text-primary disabled:opacity-30"
                                        title="Previous prompt (Ctrl+↑)"
                                    >
                                        <ArrowUp className="h-3 w-3" />
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onNavigateHistory?.('down');
                                        }}
                                        disabled={historyIndex === -1}
                                        className="h-6 w-6 p-0 text-white hover:text-primary disabled:opacity-30"
                                        title="Next prompt (Ctrl+↓)"
                                    >
                                        <ArrowUp className="h-3 w-3 rotate-180" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Input Row */}
                        <div className="flex gap-2 mb-2 md:mb-0">
                            <div className="flex-1 relative">
                                <Textarea
                                    value={lightboxPrompt}
                                    onChange={(e) => {
                                        setLightboxPrompt(e.target.value);
                                        onManualPromptEdit?.(); // Reset history index when manually typing
                                    }}
                                    placeholder={translate("Quick edit prompt...")}
                                    disabled={isGenerating}
                                    rows={2}
                                    className="w-full bg-white/10 border border-white/30 rounded-lg px-3 py-2 pr-10 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent backdrop-blur-sm disabled:opacity-50 resize-none text-sm md:text-base"
                                    onKeyDown={(e) => {
                                        if ((e.key === 'Enter' && e.ctrlKey) || (e.key === 'Enter' && !e.shiftKey && lightboxPrompt.trim() && !isGenerating)) {
                                            e.stopPropagation();
                                            e.preventDefault();
                                            onPromptSubmit();
                                            if (!e.ctrlKey) {
                                                setLightboxPrompt('');
                                            }
                                        } else if (e.key === 'ArrowUp' && e.ctrlKey) {
                                            e.stopPropagation();
                                            e.preventDefault();
                                            onNavigateHistory?.('up');
                                        } else if (e.key === 'ArrowDown' && e.ctrlKey) {
                                            e.stopPropagation();
                                            e.preventDefault();
                                            onNavigateHistory?.('down');
                                        } else if (e.key === 'Escape') {
                                            e.stopPropagation();
                                            e.preventDefault();
                                            setLightboxPrompt('');
                                        } else if (e.key.startsWith('Arrow') || e.key === 'Delete' || e.key === 'Backspace') {
                                            e.stopPropagation();
                                        }
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                />
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onMicrophoneToggle?.();
                                    }}
                                    disabled={isTranscribing}
                                    className={`absolute right-2 bottom-2 p-1 rounded-md transition-colors ${isRecording
                                        ? 'bg-red-600/80 text-white hover:bg-red-700'
                                        : 'text-white/60 hover:text-white hover:bg-white/10'
                                        }`}
                                    title={isRecording ? 'Stop recording' : 'Record audio'}
                                >
                                    {isTranscribing ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                    ) : isRecording ? (
                                        <MicOff size={16} />
                                    ) : (
                                        <Mic size={16} />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Style Presets - Minimal Row */}
                        <div className="mb-2 mt-2">
                            <Suspense fallback={null}>
                                <StylePresetSelector
                                    presets={quickActions}
                                    onSelect={(preset) => {
                                        const current = lightboxPrompt || '';
                                        const trimmed = current.trim();
                                        const separator = trimmed ? ', ' : '';
                                        setLightboxPrompt(`${trimmed}${separator}${preset.prompt}`);
                                    }}
                                    variant="minimal"
                                    disabled={isGenerating}
                                />
                            </Suspense>
                        </div>

                        {/* Actions Row - Separate on mobile */}
                        <div className="flex gap-2 flex-wrap md:flex-nowrap">
                            {/* Templates Dropdown */}
                            <DropdownMenu modal={false}>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        onClick={(e) => e.stopPropagation()}
                                        variant="ghost"
                                        className="text-white hover:text-primary disabled:opacity-50 p-2.5 md:p-2 transition-colors duration-200 min-w-[44px] md:min-w-0"
                                        title={translate("Prompt Templates")}
                                    >
                                        <FileText size={20} className="md:w-5 md:h-5" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-64 z-[10000]">
                                    {promptTemplates.length === 0 ? (
                                        <div className="px-2 py-3 text-sm text-muted-foreground text-center">
                                            <T>No templates saved yet</T>
                                        </div>
                                    ) : (
                                        <>
                                            {promptTemplates.map((template, index) => (
                                                <DropdownMenuItem
                                                    key={index}
                                                    onSelect={() => onApplyTemplate?.(template.template)}
                                                    className="flex items-center justify-between group"
                                                >
                                                    <span className="flex-1 truncate">{template.name}</span>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onDeleteTemplate?.(index);
                                                        }}
                                                        className="opacity-0 group-hover:opacity-100 ml-2 p-1 hover:bg-destructive/20 rounded"
                                                        title={translate("Delete template")}
                                                    >
                                                        <Trash2 className="h-3 w-3 text-destructive" />
                                                    </button>
                                                </DropdownMenuItem>
                                            ))}
                                            <DropdownMenuSeparator />
                                        </>
                                    )}
                                    <DropdownMenuItem onSelect={() => onSaveTemplate?.()}>
                                        <Plus className="h-3 w-3 mr-2" />
                                        <T>Save current as template</T>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            {onOpenInWizard && (
                                <Button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onOpenInWizard();
                                    }}
                                    variant="ghost"
                                    className="text-white hover:text-purple-400 p-2.5 md:p-2 transition-colors duration-200 min-w-[44px] md:min-w-0"
                                    title={translate("Open in AI Wizard for advanced editing")}
                                >
                                    <Wand2 size={20} className="md:w-5 md:h-5" />
                                </Button>
                            )}
                            <Button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onOptimizePrompt?.();
                                }}
                                disabled={isOptimizing || !lightboxPrompt.trim()}
                                variant="ghost"
                                className="text-white hover:text-primary disabled:opacity-50 p-2.5 md:p-2 transition-colors duration-200 min-w-[44px] md:min-w-0"
                                title={translate("Optimize prompt with AI")}
                            >
                                {isOptimizing ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                ) : (
                                    <Sparkles size={20} className="md:w-5 md:h-5" />
                                )}
                            </Button>
                            <Button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (lightboxPrompt.trim() && !isGenerating) {
                                        onPromptSubmit();
                                        setLightboxPrompt('');
                                    }
                                }}
                                disabled={!lightboxPrompt.trim() || isGenerating}
                                variant="ghost"
                                className="text-primary hover:text-primary/80 disabled:opacity-50 p-2.5 md:p-2 transition-colors duration-200 min-w-[44px] md:min-w-0"
                                title="Generate (Enter to submit)"
                            >
                                {isGenerating ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent"></div>
                                ) : (
                                    <ArrowUp size={20} className="md:w-5 md:h-5" />
                                )}
                            </Button>
                            {showQuickPublish && (
                                <Button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onQuickPublish?.();
                                    }}
                                    disabled={isPublishing}
                                    variant="ghost"
                                    className="text-green-500 hover:text-green-400 disabled:opacity-50 p-2.5 md:p-2 transition-colors duration-200 min-w-[44px] md:min-w-0"
                                    title="Quick Publish with prompt as description"
                                >
                                    {isPublishing ? (
                                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-green-500 border-t-transparent"></div>
                                    ) : (
                                        <Upload size={20} className="md:w-5 md:h-5" />
                                    )}
                                </Button>
                            )}
                            {showPublish && (
                                <Button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onPublishClick();
                                    }}
                                    disabled={isPublishing}
                                    variant="ghost"
                                    className="text-green-500 hover:text-green-400 disabled:opacity-50 p-2.5 md:p-2 transition-colors duration-200 min-w-[44px] md:min-w-0"
                                    title="Publish to gallery with options"
                                >
                                    {isPublishing ? (
                                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-green-500 border-t-transparent"></div>
                                    ) : (
                                        <Save size={20} className="md:w-5 md:h-5" />
                                    )}
                                </Button>
                            )}
                            <Button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onHide();
                                }}
                                variant="ghost"
                                className="text-white/60 hover:text-white p-2.5 md:p-2 transition-colors duration-200 min-w-[44px] md:min-w-0 md:ml-auto"
                                title={translate("Hide prompt")}
                                type="button"
                            >
                                <ArrowDown size={20} className="md:w-5 md:h-5" />
                            </Button>
                        </div>
                    </>
                ) : (
                    /* Simple Mode: Same layout as wizard, fewer buttons */
                    <>
                        {/* Input Row */}
                        <div className="flex gap-2 mb-2 md:mb-0">
                            <div className="flex-1 relative">
                                <Textarea
                                    value={lightboxPrompt}
                                    onChange={(e) => {
                                        setLightboxPrompt(e.target.value);
                                        onManualPromptEdit?.(); // Reset history index when manually typing
                                    }}
                                    placeholder={translate("Quick edit prompt...")}
                                    disabled={isGenerating}
                                    rows={2}
                                    className="w-full bg-white/10 border border-white/30 rounded-lg px-3 py-2 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent backdrop-blur-sm disabled:opacity-50 resize-none text-sm md:text-base"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey && lightboxPrompt.trim() && !isGenerating) {
                                            e.stopPropagation();
                                            e.preventDefault();
                                            onPromptSubmit();
                                        } else if (e.key === 'Escape') {
                                            e.stopPropagation();
                                            e.preventDefault();
                                            setLightboxPrompt('');
                                        } else if (e.key.startsWith('Arrow') || e.key === 'Delete' || e.key === 'Backspace') {
                                            e.stopPropagation();
                                        }
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                        </div>

                        {/* Style Presets - Minimal Row (Simple Mode) */}
                        <div className="mb-2 mt-2">
                            <Suspense fallback={null}>
                                <StylePresetSelector
                                    presets={quickActions}
                                    onSelect={(preset) => {
                                        const current = lightboxPrompt || '';
                                        const trimmed = current.trim();
                                        const separator = trimmed ? ', ' : '';
                                        setLightboxPrompt(`${trimmed}${separator}${preset.prompt}`);
                                    }}
                                    variant="minimal"
                                    disabled={isGenerating}
                                />
                            </Suspense>
                        </div>

                        {/* Actions Row - Simple mode */}
                        <div className="flex gap-2">
                            <Button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (lightboxPrompt.trim() && !isGenerating) {
                                        onPromptSubmit();
                                    }
                                }}
                                disabled={!lightboxPrompt.trim() || isGenerating}
                                variant="ghost"
                                className="text-primary hover:text-primary/80 disabled:opacity-50 p-2.5 md:p-2 transition-colors duration-200 min-w-[44px] md:min-w-0"
                                title="Generate (Enter to submit)"
                            >
                                {isGenerating ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent"></div>
                                ) : (
                                    <ArrowUp size={20} className="md:w-5 md:h-5" />
                                )}
                            </Button>
                            {showPublish && (
                                <Button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onPublishClick();
                                    }}
                                    disabled={isPublishing}
                                    variant="ghost"
                                    className="text-green-500 hover:text-green-400 disabled:opacity-50 p-2.5 md:p-2 transition-colors duration-200 min-w-[44px] md:min-w-0"
                                    title="Publish to gallery"
                                >
                                    {isPublishing ? (
                                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-green-500 border-t-transparent"></div>
                                    ) : (
                                        <Save size={20} className="md:w-5 md:h-5" />
                                    )}
                                </Button>
                            )}
                            <Button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onHide();
                                }}
                                variant="ghost"
                                className="text-white/60 hover:text-white p-2.5 md:p-2 transition-colors duration-200 min-w-[44px] md:min-w-0"
                                title={translate("Hide prompt")}
                                type="button"
                            >
                                <ArrowDown size={20} className="md:w-5 md:h-5" />
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
