import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { T } from '@/i18n';
import { usePageGenerator } from '@/hooks/usePageGenerator';
import { usePromptHistory } from '@/hooks/usePromptHistory';
import { AIPageGenerator } from '@/modules/pages/AIPageGenerator';
import VoiceRecordingPopup from '@/components/VoiceRecordingPopup';

interface PageCreationWizardProps {
    isOpen: boolean;
    onClose: () => void;
    parentId?: string | null;
}

export const PageCreationWizard: React.FC<PageCreationWizardProps> = ({
    isOpen,
    onClose,
    parentId
}) => {
    const { generatePageFromText, isGenerating, status, cancelGeneration } = usePageGenerator();
    const [showVoicePopup, setShowVoicePopup] = useState(false);

    const {
        prompt: textPrompt,
        setPrompt: setTextPrompt,
        promptHistory,
        historyIndex,
        navigateHistory,
        addPromptToHistory,
        setHistoryIndex
    } = usePromptHistory();

    const handleGeneratePageFromText = async (options: { 
        useImageTools: boolean; 
        model?: string; 
        imageModel?: string; 
        referenceImages?: string[];
        webSearchEnabled?: boolean;
        pageToolsEnabled?: boolean;
        vfsToolsEnabled?: boolean;
        toolsEnabled?: boolean;
    }) => {
        if (!textPrompt.trim()) return;

        addPromptToHistory(textPrompt);
        setHistoryIndex(-1);

        const result = await generatePageFromText(textPrompt, {
            ...options,
            parentId: parentId || undefined
        });

        // Only close on success
        if (result) {
            onClose();
        }
    };

    const handleGeneratePageFromVoice = async (transcribedText: string) => {
        setShowVoicePopup(false);
        // For voice, we assume the user wants the full experience, including images
        const result = await generatePageFromText(transcribedText, {
            useImageTools: true,
            parentId: parentId || undefined
        });
        if (result) onClose();
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
                <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle><T>Create New Page</T></DialogTitle>
                        <DialogDescription>
                            <T>Describe the page you want the AI to create. It will be created as a child of the current page.</T>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <AIPageGenerator
                            prompt={textPrompt}
                            onPromptChange={setTextPrompt}
                            onGenerate={handleGeneratePageFromText}
                            isGenerating={isGenerating}
                            generationStatus={status}
                            onCancel={cancelGeneration}
                            promptHistory={promptHistory}
                            historyIndex={historyIndex}
                            onNavigateHistory={navigateHistory}
                        />
                    </div>
                </DialogContent>
            </Dialog>

            {showVoicePopup && (
                <VoiceRecordingPopup
                    isOpen={showVoicePopup}
                    onClose={() => setShowVoicePopup(false)}
                    onTranscriptionComplete={handleGeneratePageFromVoice}
                />
            )}
        </>
    );
};
