import React from 'react';
import ImageLightbox from "@/components/ImageLightbox";
import { usePostLLM } from "../llm";
import { PostMediaItem } from "../types";
import { User } from "@polymech/shared";

interface SmartLightboxEditorProps {
    isOpen: boolean;
    onClose: () => void;
    imageUrl?: string;
    imageTitle?: string;
    mediaItem: PostMediaItem;
    user: User;
    isVideo: boolean;

    // Navigation / Parent Actions
    onPublish: (option: 'overwrite' | 'new' | 'version', imageUrl: string, newTitle: string, description?: string, parentId?: string, collectionIds?: string[]) => Promise<void>;
    onNavigate: (direction: 'prev' | 'next') => void;
    onOpenInWizard: () => void;
    currentIndex?: number;
    totalCount?: number;
}

const SmartLightboxEditor: React.FC<SmartLightboxEditorProps> = ({
    isOpen,
    onClose,
    imageUrl,
    imageTitle,
    mediaItem,
    user,
    isVideo,
    onPublish,
    onNavigate,
    onOpenInWizard,
    currentIndex,
    totalCount
}) => {
    // Heavy LLM hook — only loaded in this chunk
    const llm = usePostLLM(user, mediaItem);

    // Provide a bridge for the onClose to also clear LLM state
    const handleClose = () => {
        onClose();
        llm.setGeneratedImageUrl(null);
        llm.setLightboxPrompt('');
    };

    const handlePublishBridge = async (option: 'overwrite' | 'new' | 'version', imgUrl: string, newTitle: string, description?: string, parentId?: string, collectionIds?: string[]) => {
        await onPublish(option, imgUrl, newTitle, description, parentId, collectionIds);
        // Clean up internal state after publish
        llm.setGeneratedImageUrl(null);
    };

    // Quick publish wrapper
    const handleQuickPublishBridge = async () => {
        if (!llm.generatedImageUrl || !mediaItem || isVideo || !user) return;
        await onPublish('version', llm.generatedImageUrl, mediaItem.title, llm.lightboxPrompt.trim(), mediaItem.id, []);
        llm.setGeneratedImageUrl(null);
    };

    return (
        <ImageLightbox
            isOpen={isOpen}
            onClose={handleClose}
            imageUrl={imageUrl || mediaItem.image_url}
            imageTitle={imageTitle || mediaItem.title}

            onPublish={handlePublishBridge}
            generatedImageUrl={llm.generatedImageUrl || undefined}

            // Navigation
            currentIndex={currentIndex}
            totalCount={totalCount}
            onNavigate={onNavigate}
            originalImageId={mediaItem.id}
            onOpenInWizard={onOpenInWizard}

            // Grouped Editor Config
            editorConfig={{
                lightboxPrompt: llm.lightboxPrompt,
                setLightboxPrompt: llm.setLightboxPrompt,
                onPromptSubmit: () => llm.handlePromptSubmit(llm.lightboxPrompt, isVideo),
                isGenerating: llm.isGenerating,
                isPublishing: false,
                showPublish: !!llm.generatedImageUrl,

                showWizardFeatures: true,
                promptTemplates: llm.promptTemplates,
                onApplyTemplate: llm.handleApplyTemplate,
                onSaveTemplate: llm.handleSaveTemplate,
                onDeleteTemplate: llm.handleDeleteTemplate,
                onOptimizePrompt: llm.handleOptimizePrompt,
                isOptimizing: llm.isOptimizingPrompt,
                onMicrophoneToggle: llm.handleMicrophone,
                isRecording: llm.isRecording,
                isTranscribing: llm.isTranscribing,

                showQuickPublish: !!llm.generatedImageUrl && llm.lightboxPrompt.trim().length > 0,
                onQuickPublish: handleQuickPublishBridge,

                promptHistory: llm.promptHistory,
                historyIndex: llm.historyIndex,
                onNavigateHistory: llm.navigatePromptHistory,
                onManualPromptEdit: () => llm.setHistoryIndex(-1)
            }}
        />
    );
};

export default SmartLightboxEditor;
