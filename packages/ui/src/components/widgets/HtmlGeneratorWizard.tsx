import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { T } from '@/i18n';
import { AIPageGenerator } from '@/modules/pages/AIPageGenerator';
import { generateHtmlSnippet } from '@/lib/openai';
import { toast } from 'sonner';
import { usePromptHistory } from '@/hooks/usePromptHistory';

interface HtmlGeneratorWizardProps {
    isOpen: boolean;
    onClose: () => void;
    onHtmlGenerated: (html: string) => void;
    initialPrompt?: string;
    contextVariables?: Record<string, any>;
    pageContext?: any;
}

export const HtmlGeneratorWizard: React.FC<HtmlGeneratorWizardProps> = ({
    isOpen,
    onClose,
    onHtmlGenerated,
    initialPrompt = '',
    contextVariables = {},
    pageContext
}) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [includePageContext, setIncludePageContext] = useState(false);

    // Reuse the prompt history hook for consistent behavior
    const {
        prompt,
        setPrompt,
        promptHistory,
        historyIndex,
        navigateHistory,
        addPromptToHistory
    } = usePromptHistory();

    // Reset prompt when opening with new initialPrompt
    useEffect(() => {
        if (isOpen && initialPrompt) {
            setPrompt(initialPrompt);
        } else if (isOpen) {
            setPrompt('');
        }
    }, [isOpen, initialPrompt, setPrompt]);

    const handleGenerate = async (options: { 
        useImageTools: boolean; 
        model?: string; 
        provider?: string; 
        imageModel?: string; 
        referenceImages?: string[];
        webSearchEnabled?: boolean;
        pageToolsEnabled?: boolean;
        vfsToolsEnabled?: boolean;
        toolsEnabled?: boolean;
    }) => {
        if (!prompt.trim()) return;

        setIsGenerating(true);
        addPromptToHistory(prompt);

        try {
            const html = await generateHtmlSnippet(
                prompt,
                contextVariables,
                includePageContext ? pageContext : null
            );

            if (html) {
                onHtmlGenerated(html);
                onClose();
                toast.success('HTML snippet generated successfully!');
            } else {
                toast.error('Failed to generate HTML snippet.');
            }
        } catch (error) {
            console.error('HTML generation error:', error);
            toast.error('An error occurred during generation.');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle><T>Generate HTML Code</T></DialogTitle>
                    <DialogDescription>
                        <T>Describe the UI component or section you want to create. The AI will generate pure HTML using Tailwind CSS.</T>
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    {pageContext && (
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="include-page-context"
                                checked={includePageContext}
                                onCheckedChange={setIncludePageContext}
                            />
                            <Label htmlFor="include-page-context" className="text-sm font-medium">
                                <T>Include Page Context (JSON)</T>
                            </Label>
                        </div>
                    )}
                    <AIPageGenerator
                        prompt={prompt}
                        onPromptChange={setPrompt}
                        onGenerate={handleGenerate}
                        isGenerating={isGenerating}
                        generationStatus={isGenerating ? 'generating' : 'idle'}
                        onCancel={() => setIsGenerating(false)}
                        promptHistory={promptHistory}
                        historyIndex={historyIndex}
                        onNavigateHistory={navigateHistory}
                        // Disable image-related features for HTML generation
                        disabled={isGenerating}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
};
