
import React, { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { translate } from "@/i18n";
import { Switch } from "@/components/ui/switch";
import { LayoutGrid, SplitSquareVertical } from "lucide-react";
import { useChatEngine } from "@/modules/ai/useChatEngine";
import { createWidgetsTool, updateWidgetTool, removeWidgetTool } from "@/lib/tools-layout";
import { useLayout } from "@/modules/layout/LayoutContext";
import type { Page } from "../../types";

export interface PageEditAIParams {
    page: Page;
    pageId: string;
    selectedPageId: string | null;
    selectedWidgetId: string | null;
    selectedContainerId: string | null;
    includePageContext: boolean;
}

export function usePageEditAI({
    page,
    pageId,
    selectedPageId,
    selectedWidgetId,
    selectedContainerId,
    includePageContext,
}: PageEditAIParams) {

    const { executeCommand } = useLayout();

    const [showChat, setShowChat] = useState(false);

    const [layoutToolsEnabled, setLayoutToolsEnabled] = useState(() => {
        try { return localStorage.getItem('editor-chat-layout-tools') === 'true'; } catch { return false; }
    });
    const [splitView, setSplitView] = useState(() => {
        try { return localStorage.getItem('editor-chat-split-view') === 'true'; } catch { return false; }
    });

    const isSplitActive = showChat && layoutToolsEnabled && splitView;

    // --- Chat engine ---
    const chatEngine = useChatEngine();

    // Wire page context into chat engine
    useEffect(() => {
        chatEngine.contextProviderRef.current = showChat ? () => {
            const parts: string[] = [`Page: "${page.title}" (slug: ${page.slug})`];
            if (selectedWidgetId) parts.push(`Selected widget: ${selectedWidgetId}`);
            if (selectedContainerId) parts.push(`Selected container: ${selectedContainerId}`);
            if (includePageContext) {
                parts.push(`\n--- Page Object (JSON) ---\n${JSON.stringify(page, null, 2)}`);
            }
            return parts.join('\n');
        } : null;
        return () => { chatEngine.contextProviderRef.current = null; };
    }, [showChat, page, selectedWidgetId, selectedContainerId, includePageContext]);

    // Intercept layout tool results to auto-execute commands on the page
    useEffect(() => {
        if (!showChat || !layoutToolsEnabled) {
            chatEngine.extraToolsRef.current = null;
            return;
        }
        chatEngine.extraToolsRef.current = () => {
            const wrapTool = (tool: any) => {
                const originalFn = tool.function.function;
                tool.function.function = async (args: any, runner: any) => {
                    const resultStr: any = await originalFn(args, runner);
                    const result = typeof resultStr === 'string' ? JSON.parse(resultStr) : resultStr;
                    const effectivePageId = selectedPageId || pageId;

                    if (!result.success) return resultStr;

                    try {
                        const cmds = await import('@/modules/layout/commands');

                        switch (result.action) {
                            case 'create_widgets': {
                                if (Array.isArray(result.containers) && result.containers.length > 0) {
                                    await executeCommand(new cmds.BatchAddContainersCommand(effectivePageId, result.containers));
                                    toast.success(translate(`Added ${result.containers.length} container(s) from AI`));
                                    chatEngine.addChatLog('info', `✅ Added ${result.containers.length} container(s)`);
                                }
                                break;
                            }
                            case 'update_widget': {
                                await executeCommand(new cmds.UpdateWidgetSettingsCommand(effectivePageId, result.widgetId, result.props));
                                toast.success(translate('Widget updated by AI'));
                                chatEngine.addChatLog('info', `✅ Updated widget ${result.widgetId}`);
                                break;
                            }
                            case 'remove_widget': {
                                await executeCommand(new cmds.RemoveWidgetCommand(effectivePageId, result.widgetId));
                                toast.success(translate('Widget removed by AI'));
                                chatEngine.addChatLog('info', `✅ Removed widget ${result.widgetId}`);
                                break;
                            }
                        }
                    } catch (err: any) {
                        console.error(`[LayoutTool] ${result.action} failed:`, err);
                        chatEngine.addChatLog('error', `❌ ${result.action} failed: ${err.message}`);
                    }

                    return resultStr;
                };
                return tool;
            };

            return [
                wrapTool(createWidgetsTool()),
                wrapTool(updateWidgetTool()),
                wrapTool(removeWidgetTool()),
            ];
        };
        return () => { chatEngine.extraToolsRef.current = null; };
    }, [showChat, layoutToolsEnabled, selectedPageId, pageId, executeCommand]);

    // --- Extra toggles JSX for the chat sidebar ---
    const chatExtraToggles = React.createElement(React.Fragment, null,
        React.createElement('div', { className: 'flex items-center justify-between' },
            React.createElement('div', { className: 'flex items-center gap-2' },
                React.createElement(LayoutGrid, { className: 'h-4 w-4 text-muted-foreground' }),
                React.createElement('label', { htmlFor: 'layout-tools-toggle', className: 'text-sm cursor-pointer' }, 'Layout Tools'),
            ),
            React.createElement(Switch, {
                id: 'layout-tools-toggle',
                checked: layoutToolsEnabled,
                onCheckedChange: (v: boolean) => {
                    setLayoutToolsEnabled(v);
                    try { localStorage.setItem('editor-chat-layout-tools', String(v)); } catch { }
                },
                disabled: chatEngine.isGenerating,
            }),
        ),
        layoutToolsEnabled ? React.createElement(React.Fragment, null,
            React.createElement('div', { className: 'space-y-0.5 pl-6' },
                ...([
                    ['create_widgets', 'Add containers with widgets to the page'],
                    ['update_widget', 'Update widget props by ID'],
                    ['remove_widget', 'Remove a widget by ID'],
                ] as const).map(([name, desc]) =>
                    React.createElement('div', { key: name, className: 'text-[11px] text-muted-foreground' },
                        React.createElement('code', { className: 'text-[10px] text-primary/70' }, name),
                        ' — ', desc,
                    )
                ),
            ),
            React.createElement('div', { className: 'flex items-center justify-between' },
                React.createElement('div', { className: 'flex items-center gap-2' },
                    React.createElement(SplitSquareVertical, { className: 'h-4 w-4 text-muted-foreground' }),
                    React.createElement('label', { htmlFor: 'split-view-toggle', className: 'text-sm cursor-pointer' }, 'Split View'),
                ),
                React.createElement(Switch, {
                    id: 'split-view-toggle',
                    checked: splitView,
                    onCheckedChange: (v: boolean) => {
                        setSplitView(v);
                        try { localStorage.setItem('editor-chat-split-view', String(v)); } catch { }
                    },
                }),
            ),
        ) : null,
    );

    return {
        showChat,
        setShowChat,
        chatEngine,
        isSplitActive,
        layoutToolsEnabled,
        splitView,
        chatExtraToggles,
    };
}
