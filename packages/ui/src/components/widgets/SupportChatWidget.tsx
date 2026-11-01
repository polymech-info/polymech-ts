import React, { useState, useEffect, useCallback } from 'react';
import { T, translate } from '@/i18n';
import { MessageSquare, X, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import SupportChat from '@/pages/SupportChat';

export interface SupportChatButtonConfig {
    id: string;
    label: string;
    contextPrompt?: string;
    autoSend?: boolean;
}

export interface SupportChatWidgetProps {
    buttons?: SupportChatButtonConfig[];
    buttonLabel?: string; // Legacy fallback
    contextPrompt?: string; // Legacy fallback
    position?: 'bottom-right' | 'bottom-left';
    mode?: 'floating' | 'inline';
    autoOpen?: boolean;
    isEditMode?: boolean;
    onPropsChange?: (props: Record<string, unknown>) => void;
    /** Template variables provided by the parent layout engine (e.g. UserPage) */
    variables?: Record<string, any>;
    /** Page context (title, meta, etc) supplied by the parent */
    pageContext?: { title?: string; slug?: string; meta?: Record<string, unknown>; content?: any; categories?: any; category_paths?: any; tags?: string[] | null };
    [key: string]: unknown;
}

/**
 * Builds implicit context combining available variables and page info
 * and injects {{var}} replacements into the specific custom prompt.
 */
function buildEnrichedPrompt(
    basePrompt: string = '',
    variables?: Record<string, unknown>
): string {
    let finalPrompt = basePrompt;

    // 1. Substitute {{ variables }} in the base prompt
    if (variables) {
        Object.entries(variables).forEach(([key, val]) => {
            const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
            finalPrompt = finalPrompt.replace(regex, String(val ?? ''));
        });
    }

    return finalPrompt;
}

const SupportChatWidget: React.FC<SupportChatWidgetProps> = ({
    buttons = [],
    buttonLabel = 'Ask Questions',
    contextPrompt = '',
    position = 'bottom-right',
    mode = 'floating',
    autoOpen = false,
    isEditMode = false,
    onPropsChange,
    variables,
    pageContext,
}) => {
    const [isOpen, setIsOpen] = useState(autoOpen);
    const [activePrompt, setActivePrompt] = useState<string>(contextPrompt || '');
    const [activeAutoSend, setActiveAutoSend] = useState<boolean>(false);

    useEffect(() => {
        if (autoOpen) setIsOpen(true);
    }, [autoOpen]);

    const handleOpenChat = useCallback((prompt?: string, autoSend?: boolean) => {
        const enriched = buildEnrichedPrompt(prompt || '', variables);
        setActivePrompt(enriched);
        setActiveAutoSend(!!autoSend);
        setIsOpen(true);
    }, [variables]);

    const getSystemContext = useCallback(() => {
        let contextExt = "";
        try {
            console.log("🛠️ [getSystemContext] called with:", { pageContext, variables });
            const contextParts: string[] = [];

            if (pageContext) {
                const meta: string[] = [];
                if (pageContext.meta) meta.push(`Meta: "${JSON.stringify(pageContext.meta)}"`);
                if (pageContext.title) meta.push(`Title: "${pageContext.title}"`);
                if (pageContext.slug) meta.push(`Slug: "${pageContext.slug}"`);
                if (pageContext.meta?.description) meta.push(`Description: "${pageContext.meta.description}"`);

                if (pageContext.category_paths && Array.isArray(pageContext.category_paths)) {
                    meta.push(`Categories: [${pageContext.category_paths.map((p: any) => p.map((c: any) => c.name).join('/')).join(', ')}]`);
                } else if (pageContext.categories && Array.isArray(pageContext.categories)) {
                    meta.push(`Categories: [${pageContext.categories.map((c: any) => `${c.name} (${c.slug})`).join(', ')}]`);
                }

                if (pageContext.tags && Array.isArray(pageContext.tags)) {
                    meta.push(`Tags: [${pageContext.tags.join(', ')}]`);
                }

                if (pageContext.content) {
                    try {
                        const contentStr = typeof pageContext.content === 'string'
                            ? pageContext.content
                            : JSON.stringify(pageContext.content, null, 2);
                        meta.push(`Content Layout Data: \n${contentStr}`);
                    } catch (e) {
                        console.error("🛠️ [getSystemContext] Failed to stringify pageContext.content", e);
                    }
                }

                if (meta.length > 0) {
                    contextParts.push(`## Current Page Context\n${meta.join('\n')}`);
                }
            }

            if (variables && Object.keys(variables).length > 0) {
                try {
                    contextParts.push(`## Page Variables\n\`\`\`json\n${JSON.stringify(variables, null, 2)}\n\`\`\``);
                } catch (e) {
                    console.error("🛠️ [getSystemContext] Failed to stringify variables", e);
                }
            }

            contextExt = contextParts.length > 0 ? contextParts.join('\n\n') : "";
            console.log("🛠️ [getSystemContext] Successfully generated context of length:", contextExt.length);
            return contextExt;
        } catch (err) {
            console.error("🛠️ [getSystemContext] CRITICAL ERROR:", err);
            return null;
        }
    }, [pageContext, variables]);

    const toggleChat = useCallback(() => {
        setIsOpen((prev) => !prev);
    }, []);

    const ensureButtons = useCallback((): SupportChatButtonConfig[] => {
        if (Array.isArray(buttons) && buttons.length > 0) return buttons;
        if (typeof buttons === 'string') {
            try {
                const parsed = JSON.parse(buttons);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            } catch {
                // Ignore parse errors safely
            }
        }
        if (buttons && Array.isArray(buttons) && buttons.length > 0) return buttons; // Fallback

        // Return legacy props if no buttons defined
        return [{
            id: 'btn-default',
            label: buttonLabel ? translate(buttonLabel) : translate('Ask Questions'),
            contextPrompt: contextPrompt || ''
        }];
    }, [buttons, buttonLabel, contextPrompt]);

    const handleAddButton = useCallback(() => {
        const current = ensureButtons();
        const newBtn: SupportChatButtonConfig = {
            id: `btn-${Date.now()}`,
            label: translate('New Button'),
            contextPrompt: ''
        };
        onPropsChange?.({ buttons: [...current, newBtn] });
    }, [ensureButtons, onPropsChange]);

    const handleRemoveButton = useCallback((id: string) => {
        const current = ensureButtons();
        onPropsChange?.({ buttons: current.filter(b => b.id !== id) });
    }, [ensureButtons, onPropsChange]);

    const handleButtonChange = useCallback((id: string, field: keyof SupportChatButtonConfig, value: string | boolean) => {
        const current = ensureButtons();
        onPropsChange?.({
            buttons: current.map(b => b.id === id ? { ...b, [field]: value } : b)
        });
    }, [ensureButtons, onPropsChange]);

    const currentButtons = ensureButtons();

    // Configuration controls for the builder
    const configPanel = isEditMode ? (
        <div className="flex flex-col gap-2 bg-background p-3 rounded-lg border shadow-sm w-full mb-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase"><T>Chat Buttons</T></p>
            {currentButtons.map((btn) => (
                <div key={btn.id} className="flex flex-wrap items-center gap-2 border-b pb-2 last:border-0">
                    <input
                        type="text"
                        value={btn.label}
                        onChange={(e) => handleButtonChange(btn.id, 'label', e.target.value)}
                        placeholder={translate('Button Label...')}
                        className="text-sm px-2 py-1 border rounded min-w-[120px]"
                    />
                    <input
                        type="text"
                        value={btn.contextPrompt || ''}
                        onChange={(e) => handleButtonChange(btn.id, 'contextPrompt', e.target.value)}
                        placeholder={translate('Initial Prompt...')}
                        className="text-sm px-2 py-1 border rounded flex-1 min-w-[150px]"
                    />
                    <label className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap px-1">
                        <input
                            type="checkbox"
                            checked={!!btn.autoSend}
                            onChange={(e) => handleButtonChange(btn.id, 'autoSend', e.target.checked)}
                            className="rounded"
                        />
                        <T>Auto-send</T>
                    </label>
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                        onClick={() => handleRemoveButton(btn.id)}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ))}
            <Button
                size="sm"
                variant="outline"
                className="mt-1 border-dashed"
                onClick={handleAddButton}
            >
                <Plus className="h-3.5 w-3.5 mr-1" />
                <T>Add Button</T>
            </Button>
        </div>
    ) : null;

    // Helper to render the actual buttons
    const renderButtons = (flexClasses: string) => (
        <div className={cn("flex flex-wrap gap-2 pointer-events-auto", flexClasses)}>
            {currentButtons.map(btn => (
                <Button
                    key={btn.id}
                    onClick={() => handleOpenChat(btn.contextPrompt, btn.autoSend)}
                    size="lg"
                    className={cn(
                        "rounded-full shadow-md flex items-center gap-2 transition-transform hover:scale-105 active:scale-95",
                        isOpen && activePrompt === btn.contextPrompt ? "bg-muted text-muted-foreground hover:bg-muted/80 ring-2 ring-primary/50" : "bg-primary text-primary-foreground hover:bg-primary/90"
                    )}
                >
                    <MessageSquare className="w-5 h-5" />
                    <span className="font-semibold"><T>{btn.label}</T></span>
                </Button>
            ))}
            {isOpen && (
                <Button
                    onClick={() => setIsOpen(false)}
                    size="lg"
                    variant="secondary"
                    className="rounded-full shadow-md transition-transform hover:scale-105 active:scale-95"
                >
                    <X className="w-5 h-5" />
                </Button>
            )}
        </div>
    );

    // ── Inline Mode ─────────────────────────────────────────────────────────────
    if (mode === 'inline') {
        return (
            <div className="flex flex-col w-full h-full relative border rounded-lg overflow-hidden bg-background">
                {configPanel}
                {!isOpen ? (
                    <div className="flex flex-col items-center justify-center p-8 bg-muted/20 min-h-[200px]">
                        {renderButtons("justify-center")}
                    </div>
                ) : (
                    <div className="flex flex-col flex-1 h-full min-h-[500px]">
                        <div className="bg-primary text-primary-foreground py-1.5 px-3 flex justify-between items-center shrink-0">
                            <h3 className="font-semibold text-xs flex items-center gap-1.5">
                                <MessageSquare className="w-3.5 h-3.5" />
                                <T>Support Chat</T>
                            </h3>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-primary-foreground hover:bg-primary/20 rounded-full"
                                onClick={toggleChat}
                            >
                                <X className="w-3.5 h-3.5" />
                            </Button>
                        </div>
                        <div className="flex-1 relative bg-muted/10 h-full w-full">
                            <div className="absolute inset-x-0 bottom-0 top-0 overflow-hidden min-h-[450px]">
                                <SupportChat key={activePrompt} initialPrompt={activePrompt} autoSend={activeAutoSend} getContext={getSystemContext} layoutId="support-widget-inline" className="h-full border-0" />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // ── Floating Mode ───────────────────────────────────────────────────────────
    const posClasses = position === 'bottom-left' ? 'left-4 sm:left-6' : 'right-4 sm:right-6';
    const originClass = position === 'bottom-left' ? 'origin-bottom-left' : 'origin-bottom-right';

    return (
        <div className={cn("fixed bottom-4 sm:bottom-6 z-50 flex flex-col items-end pointer-events-none", posClasses)}>
            <div
                className={cn(
                    "pointer-events-auto transition-all duration-300 ease-in-out w-[90vw] sm:w-[400px] h-[75vh] max-h-[700px] bg-background border shadow-2xl rounded-2xl overflow-hidden flex flex-col mb-4",
                    originClass,
                    isOpen ? "scale-100 opacity-100 translate-y-0" : "scale-95 opacity-0 translate-y-8 pointer-events-none hidden"
                )}
            >
                <div className="bg-primary text-primary-foreground py-1.5 px-3 flex justify-between items-center shrink-0">
                    <h3 className="font-semibold text-xs flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <T>Support Chat</T>
                    </h3>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-primary-foreground hover:bg-primary/20 rounded-full"
                        onClick={toggleChat}
                    >
                        <X className="w-3.5 h-3.5" />
                    </Button>
                </div>
                <div className="flex-1 overflow-hidden relative bg-muted/20">
                    {isOpen && (
                        <div className="absolute inset-x-0 bottom-0 top-0 overflow-hidden [&>*]:h-full [&>*]:border-0 p-0 m-0">
                            <SupportChat key={activePrompt} initialPrompt={activePrompt} autoSend={activeAutoSend} getContext={getSystemContext} layoutId="support-widget-float" className="h-full border-0" />
                        </div>
                    )}
                </div>
            </div>

            <div className="pointer-events-auto flex flex-col items-end w-full mt-auto">
                {configPanel}
                {renderButtons("justify-end")}
            </div>
        </div>
    );
};

export default SupportChatWidget;
