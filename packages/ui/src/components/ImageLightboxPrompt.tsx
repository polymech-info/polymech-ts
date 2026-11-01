import React from 'react';
import { Wand2 } from 'lucide-react';
import { EditingToolbar } from './EditingToolbar';
import { ImageLightboxEditorConfig } from './ImageLightboxTypes';

export interface ImageLightboxPromptProps {
    config?: ImageLightboxEditorConfig;
    showPrompt: boolean;
    showPromptField: boolean;
    setShowPromptField: (show: boolean) => void;
    lightboxLoaded: boolean;

    // Info popup props
    showInfoPopup: boolean;
    setShowInfoPopup: (show: boolean) => void;
    imageTitle: string;
    currentIndex?: number;
    totalCount?: number;
    onNavigate?: (direction: 'prev' | 'next') => void;
}

export function ImageLightboxPrompt({
    config,
    showPrompt,
    showPromptField,
    setShowPromptField,
    lightboxLoaded,

    showInfoPopup,
    setShowInfoPopup,
    imageTitle,
    currentIndex,
    totalCount,
    onNavigate,
}: ImageLightboxPromptProps) {

    if (!showPrompt || !lightboxLoaded) {
        return null;
    }

    // Safely extract config properties we need in this component
    const {
        isPublishing = false,
        showWizardFeatures = false,
        promptHistory = []
    } = config || {};

    return (
        <>
            {/* Quick Prompt Field */}
            {showPromptField && config && (
                <EditingToolbar
                    config={config}
                    onHide={() => setShowPromptField(false)}
                />
            )}

            {/* Prompt Toggle Button - shown when prompt is hidden */}
            {!showPromptField && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowPromptField(true);
                        }}
                        className="bg-primary/80 hover:bg-primary text-primary-foreground p-2 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
                        title="Show prompt field (Space)"
                    >
                        <Wand2 size={20} />
                    </button>
                </div>
            )}

            {/* Info Popup */}
            {showInfoPopup && showPromptField && (
                <div
                    className="absolute bottom-16 left-1/2 transform -translate-x-1/2 bg-black/80 backdrop-blur-md text-white px-4 py-3 rounded-lg text-sm max-w-md text-center border border-white/20 z-50"
                    onClick={(e) => e.stopPropagation()}
                >
                    {isPublishing ? (
                        <div className="flex items-center justify-center gap-2">
                            <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                            <span>Publishing... • ESC to close</span>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <div className="font-medium">{imageTitle}</div>
                            {currentIndex !== undefined && totalCount !== undefined && (
                                <div className="text-white/80 text-xs">{currentIndex + 1} of {totalCount}</div>
                            )}
                            <div className="text-white/70 text-xs space-y-1">
                                <div>• Enter: generate</div>
                                <div>• Space/Click: hide prompt</div>
                                {showWizardFeatures && promptHistory.length > 0 && (
                                    <div>• Ctrl+↑↓: prompt history</div>
                                )}
                                {onNavigate && totalCount && totalCount > 1 && (
                                    <div>• ← → keys or swipe: navigate</div>
                                )}
                                <div>• ESC: close lightbox</div>
                            </div>
                        </div>
                    )}
                    {/* Close popup when clicking outside */}
                    <div
                        className="fixed inset-0 z-[-1]"
                        onClick={() => setShowInfoPopup(false)}
                    />
                </div>
            )}
        </>
    );
}
