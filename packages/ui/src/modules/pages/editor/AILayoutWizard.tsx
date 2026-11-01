import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { T, translate } from '@/i18n';
import { AIPageGenerator } from '@/modules/pages/AIPageGenerator';
import { runTools } from '@/lib/openai';
import { toast } from 'sonner';
import { usePromptHistory } from '@/hooks/usePromptHistory';
import { LayoutContainer } from '@/modules/layout/LayoutManager';

interface AILayoutWizardProps {
    isOpen: boolean;
    onClose: () => void;
    onContainersGenerated: (containers: LayoutContainer[]) => void;
    /** Merged page / category / user variables — flat key→value pairs */
    contextVariables?: Record<string, string>;
    /** Minimal page context forwarded to the LLM for awareness */
    pageContext?: { title?: string; slug?: string; meta?: Record<string, any>; content?: any; categories?: any; category_paths?: any; tags?: string[] | null };
}

/**
 * Build added context that gets prepended to the user prompt so the LLM
 * knows which template variables exist and what the page is about.
 */
function buildImplicitContext(
    contextVariables?: Record<string, string>,
    pageContext?: AILayoutWizardProps['pageContext'],
): string {
    const parts: string[] = [];

    // ── Page metadata ──
    if (pageContext) {
        const meta: string[] = [];
        if (pageContext.title) meta.push(`Title: "${pageContext.title}"`);
        if (pageContext.slug) meta.push(`Slug: "${pageContext.slug}"`);
        if (pageContext.meta?.description) meta.push(`Description: "${pageContext.meta.description}"`);
        if (meta.length > 0) {
            parts.push(`## Current page\n${meta.join('\n')}`);
        }
    }

    // ── Template variables with current values ──
    if (contextVariables && Object.keys(contextVariables).length > 0) {
        parts.push(
            `## Available template variables\nYou may reference these with ${name} syntax inside widget text (HTML Widget, Markdown Widget).\nCurrent values:\n\`\`\`json\n${JSON.stringify(contextVariables, null, 2)}\n\`\`\`\nUse the actual values above to produce realistic, data-driven content.`
        );
    }

    return parts.length > 0
        ? parts.join('\n\n') + '\n\n---\n\n'
        : '';
}

export const AILayoutWizard: React.FC<AILayoutWizardProps> = ({
    isOpen,
    onClose,
    onContainersGenerated,
    contextVariables,
    pageContext,
}) => {
    const [isGenerating, setIsGenerating] = useState(false);

    const {
        prompt,
        setPrompt,
        promptHistory,
        historyIndex,
        navigateHistory,
        addPromptToHistory,
    } = usePromptHistory();

    useEffect(() => {
        if (isOpen) setPrompt('');
    }, [isOpen, setPrompt]);

    const handleGenerate = async () => {
        if (!prompt.trim()) return;

        setIsGenerating(true);
        addPromptToHistory(prompt);

        try {
            // Prepend implicit context (variables, page info) to the user prompt
            const enrichedPrompt = buildImplicitContext(contextVariables, pageContext) + prompt;

            const result = await runTools({
                prompt: enrichedPrompt,
                preset: 'layout-generator',
            });

            if (!result.success) {
                toast.error(result.error || 'AI generation failed.');
                return;
            }


            // Extract containers from ALL create_widgets tool calls (LLM may call it multiple times)
            const allContainers = result.toolCalls
                .filter((tc: any) => tc.function?.name === 'create_widgets')
                .flatMap((tc: any) => {
                    const out = tc.function?.output;
                    return out?.success && Array.isArray(out.containers) ? out.containers : [];
                });

            if (allContainers.length > 0) {
                onContainersGenerated(allContainers);
                onClose();
                toast.success(`Generated ${allContainers.length} container(s)`);
            } else {
                toast.error(translate('AI did not produce any layout containers.'));
            }
        } catch (error: any) {
            console.error('[AILayoutWizard] Generation error:', error);
            toast.error(translate('An error occurred during generation.'));
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle><T>AI Layout Assistant</T></DialogTitle>
                    <DialogDescription>
                        <T>Describe the layout you want — e.g. "Product page with hero image, 2-column features grid, and a reviews section"</T>
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
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
                        disabled={isGenerating}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
};
