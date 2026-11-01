import { QuickAction } from "@/constants";

export interface ImageLightboxEditorConfig {
    showWizardFeatures?: boolean;
    lightboxPrompt: string;
    setLightboxPrompt: (value: string) => void;
    isGenerating?: boolean;
    isPublishing?: boolean;
    isOptimizing?: boolean;
    isRecording?: boolean;
    isTranscribing?: boolean;
    onPromptSubmit?: () => void;
    onMicrophoneToggle?: () => void;
    onManualPromptEdit?: () => void;
    promptTemplates?: Array<{ name: string; template: string }>;
    onApplyTemplate?: (template: string) => void;
    onSaveTemplate?: () => void;
    onDeleteTemplate?: (index: number) => void;
    onOptimizePrompt?: () => void;
    onOpenInWizard?: () => void;

    // Prompt history
    onNavigateHistory?: (direction: 'up' | 'down') => void;
    promptHistory?: string[];
    historyIndex?: number;

    // Publish
    showPublish?: boolean;
    showQuickPublish?: boolean;
    onQuickPublish?: () => void;
    onPublishClick?: () => void;

    // Quick actions
    quickActions?: QuickAction[];
}
