/**
 * ChatPanel — reusable AI chat component with preset modes.
 *
 * Presets:
 *   - simple:    Chat only (messages + composer). No header, no sidebar.
 *   - standard:  Chat + header. Sidebar toggle available.
 *   - developer: Full experience — header + sidebar (open by default, all sections).
 *
 * Embeddable anywhere. Owns its own useChatEngine instance.
 * Parent can override individual section visibility via props.
 */

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Bot } from 'lucide-react';
import { useChatEngine } from '@/modules/ai/useChatEngine';
import ChatHeader from '@/modules/ai/components/ChatHeader';
import ChatSidebar from '@/modules/ai/components/ChatSidebar';
import ChatComposer from '@/modules/ai/components/ChatComposer';
import MessageBubble from '@/modules/ai/components/MessageBubble';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { buildSupportPrompt, SupportContextKey } from '@/modules/ai/defaults';

// ── Types ────────────────────────────────────────────────────────────────

export type ChatPreset = 'simple' | 'standard' | 'developer' | 'support';

export interface ChatPanelProps {
    /** Preset controls the default layout. Default: 'developer' */
    preset?: ChatPreset;
    /** Override: show/hide the header bar */
    showHeader?: boolean;
    /** Override: allow sidebar (settings toggle visible in header) */
    showSidebar?: boolean;
    /** Override: sidebar initially open */
    sidebarOpen?: boolean;
    /** CSS class on the outer container */
    className?: string;
    /** Unique layout persistence ID (defaults to 'chat-layout') */
    layoutId?: string;
    /**
     * Dynamic context provider — called just before each send.
     * Return a string to inject into the system prompt, or null to skip.
     * Use this to inject page context, selection state, etc.
     */
    getContext?: () => string | null;
    /**
     * Extra tools provider — called when assembling tools for each send.
     * Return an array of OpenAI-compatible tool definitions (RunnableToolFunctionWithParse).
     */
    extraTools?: () => any[];
    /**
     * Pre-wired engine instance. When provided, ChatPanel uses this engine
     * instead of creating its own via useChatEngine(). The caller is
     * responsible for wiring context/tools into the engine.
     * getContext and extraTools props are ignored when engine is supplied.
     */
    engine?: ReturnType<typeof useChatEngine>;
    /**
     * Extra toggles to render in the sidebar (for edit mode specific tools)
     */
    extraToggles?: React.ReactNode;
    /**
     * Seed the engine with a fixed provider on first mount.
     * Useful for support / embedded chat where the provider must not be changed by the user.
     */
    initialProvider?: string;
    /** Seed the engine with a fixed model on first mount. */
    initialModel?: string;
    /** Seed the engine with a system prompt on first mount. */
    initialSystemPrompt?: string;
    /**
     * Named context additions from defaults.ts to append to the base support prompt.
     * Used when initialSystemPrompt is NOT provided — the prompt is assembled via
     * buildSupportPrompt() using the current UI language + these context keys.
     * e.g. context={['shipping-rates']}
     */
    context?: SupportContextKey[];
    /** Seed search-tools enabled on first mount. */
    initialSearchToolsEnabled?: boolean;
    /** Seed page-tools enabled on first mount. */
    initialPageToolsEnabled?: boolean;
    /** Seed image-tools enabled on first mount. */
    initialImageToolsEnabled?: boolean;
    /** Seed VFS-tools enabled on first mount. */
    initialVfsToolsEnabled?: boolean;
    /**
     * Portal target for the composer. If provided, the composer is rendered
     * into this DOM element via createPortal instead of inside the messages panel.
     * Use this to mount the chat input in a completely different part of the page.
     *
     * @example
     * const composerTarget = useRef<HTMLDivElement>(null);
     * <ChatPanel composerPortal={composerTarget} />
     * <div ref={composerTarget} /> // composer renders here
     */
    composerPortal?: React.RefObject<HTMLElement | null>;
    /** Initial user input to populate in the text area when opened */
    initialPrompt?: string;
    /** If true, the initialPrompt will be submitted immediately */
    initialAutoSend?: boolean;
}

// ── Preset defaults ──────────────────────────────────────────────────────

const PRESET_DEFAULTS: Record<ChatPreset, {
    showHeader: boolean;
    showSidebar: boolean;
    sidebarOpen: boolean;
}> = {
    simple: {
        showHeader: false,
        showSidebar: false,
        sidebarOpen: false,
    },
    standard: {
        showHeader: true,
        showSidebar: true,
        sidebarOpen: false,
    },
    developer: {
        showHeader: true,
        showSidebar: true,
        sidebarOpen: true,
    },
    support: {
        showHeader: false,
        showSidebar: false,
        sidebarOpen: false,
    },
};

// ── Messages + Composer sub-component ─────────────────────────────────────

const ChatMessages: React.FC<{
    engine: ReturnType<typeof useChatEngine>;
    composerPortal?: React.RefObject<HTMLElement | null>;
    layoutId: string;
}> = ({ engine, composerPortal, layoutId }) => {
    const composer = (
        <ChatComposer
            input={engine.input}
            onInputChange={engine.setInput}
            attachments={engine.attachments}
            isGenerating={engine.isGenerating}
            isDragging={engine.isDragging}
            canSend={engine.canSend}
            showImagePicker={engine.showImagePicker}
            isRecording={engine.isRecording}
            isTranscribing={engine.isTranscribing}
            composerRef={engine.composerRef}
            inputRef={engine.inputRef}
            fileInputRef={engine.fileInputRef}
            promptHistory={engine.promptHistory}
            historyIndex={engine.historyIndex}
            navigateHistory={engine.navigateHistory}
            onSend={engine.sendMessage}
            onCancel={engine.handleCancel}
            onKeyDown={engine.handleKeyDown}
            onPaste={engine.handlePaste}
            onRemoveAttachment={engine.removeAttachment}
            onToggleRecording={engine.handleMicrophoneToggle}
            onFileInputChange={engine.handleFileInputChange}
            onDragEnter={engine.handleDragEnter}
            onDragLeave={engine.handleDragLeave}
            onDragOver={engine.handleDragOver}
            onDrop={engine.handleDrop}
            onOpenFilePicker={() => engine.fileInputRef.current?.click()}
            onOpenGallery={() => engine.setShowImagePicker(true)}
            onCloseGallery={() => engine.setShowImagePicker(false)}
            onPickerSelect={engine.handlePickerSelect}
            onPickerSelectSingle={(pic: any) => {
                engine.handlePickerSelect([pic]);
            }}
            fileContexts={engine.fileContexts}
            onRemoveFileContext={engine.removeFileContext}
        />
    );

    const bottomRef = useRef<HTMLDivElement | null>(null);
    const scrollContainerRef = engine.scrollRef;

    // Interrupt auto-scroll if the user scrolls up manually
    useEffect(() => {
        const el = scrollContainerRef.current;
        if (!el) return;

        const handleScroll = () => {
            const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
            engine.isUserScrolledUpRef.current = !isAtBottom;
        };
        el.addEventListener('scroll', handleScroll, { passive: true });
        return () => el.removeEventListener('scroll', handleScroll);
    }, [scrollContainerRef, engine.isUserScrolledUpRef]);

    // Scroll to bottom when messages change or stream updates
    useEffect(() => {
        if (!engine.isUserScrolledUpRef.current) {
            bottomRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
        }
    }, [engine.messages, engine.isUserScrolledUpRef]);

    return (
        <div className="h-full w-full overflow-hidden flex flex-col min-h-0 min-w-0 border rounded-lg bg-background">
            <ResizablePanelGroup direction="vertical" autoSaveId={`${layoutId}-prompt-splitter`}>
                {/* Messages */}
                <ResizablePanel defaultSize={85} className="flex flex-col min-h-0">
                    <div
                        ref={scrollContainerRef}
                        className="flex-1 min-h-0 overflow-y-auto p-2 sm:p-4 space-y-3 sm:space-y-4"
                        data-testid="chat-messages"
                    >
                        {engine.messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
                                <Bot className="h-10 w-10 sm:h-12 sm:w-12 opacity-30" />
                                <p className="text-sm text-center px-4">Send a message to start chatting</p>
                                <p className="text-xs opacity-60 text-center px-4">
                                    Using {engine.provider}/{engine.model} • Enter to send
                                </p>
                                <p className="text-xs opacity-40 text-center">
                                    Drop images or use 📎 to attach
                                </p>
                            </div>
                        ) : (
                            engine.messages
                                .filter(msg => msg.role !== 'tool')
                                .map(msg => (
                                    <MessageBubble
                                        key={msg.id}
                                        message={msg}
                                        onCancel={msg.isStreaming ? engine.handleCancel : undefined}
                                    />
                                ))
                        )}
                        <div ref={bottomRef} className="h-2 flex-shrink-0" />
                    </div>

                    {/* Mini-log: last 2 info-level entries for at-a-glance activity */}
                    {(() => {
                        const recent = engine.chatLogs
                            .filter(l => l.level === 'info')
                            .slice(-2);
                        if (!recent.length) return null;
                        return (
                            <div className="flex-shrink-0 border-t px-3 py-1 space-y-0.5 bg-muted/30 mt-auto">
                                {recent.map(l => (
                                    <p key={l.id} className="text-[11px] text-muted-foreground truncate leading-tight" title={l.message}>
                                        {l.message}
                                    </p>
                                ))}
                            </div>
                        );
                    })()}
                </ResizablePanel>

                {/* Composer — portaled if target exists, inline as a resizable panel otherwise */}
                {composerPortal?.current ? (
                    createPortal(composer, composerPortal.current)
                ) : (
                    <>
                        <ResizableHandle withHandle />
                        <ResizablePanel defaultSize={15} minSize={10} className="flex flex-col min-h-0">
                            {composer}
                        </ResizablePanel>
                    </>
                )}
            </ResizablePanelGroup>
        </div>
    );
};

// ── Sidebar props helper ─────────────────────────────────────────────────

export const sidebarProps = (engine: ReturnType<typeof useChatEngine>) => ({
    provider: engine.provider,
    model: engine.model,
    onProviderChange: engine.setProvider,
    onModelChange: engine.setModel,
    systemPrompt: engine.systemPrompt,
    onSystemPromptChange: engine.setSystemPrompt,
    toolsEnabled: engine.toolsEnabled,
    onToolsEnabledChange: engine.setToolsEnabled,
    pageToolsEnabled: engine.pageToolsEnabled,
    onPageToolsEnabledChange: engine.setPageToolsEnabled,
    imageToolsEnabled: engine.imageToolsEnabled,
    onImageToolsEnabledChange: engine.setImageToolsEnabled,
    imageModel: engine.imageModel,
    onImageModelChange: engine.setImageModel,
    vfsToolsEnabled: engine.vfsToolsEnabled,
    onVfsToolsEnabledChange: engine.setVfsToolsEnabled,
    webSearchEnabled: engine.webSearchEnabled,
    onWebSearchEnabledChange: engine.setWebSearchEnabled,
    isGenerating: engine.isGenerating,
    messages: engine.messages,
    user: engine.user,
    chatLogs: engine.chatLogs,
    onClearLogs: () => engine.setChatLogs([]),
    lastApiMessages: engine.lastApiMessages,
    sessionId: engine.sessionId,
    sessions: engine.sessions,
    onNewSession: engine.handleNewSession,
    onLoadSession: engine.handleLoadSession,
    onDeleteSession: engine.handleDeleteSession,
    fileContexts: engine.fileContexts,
    addFileContext: engine.addFileContext,
    removeFileContext: engine.removeFileContext,
});

// ── Main Component ───────────────────────────────────────────────────────

const ChatPanel: React.FC<ChatPanelProps> = ({
    preset = 'developer',
    showHeader: showHeaderProp,
    showSidebar: showSidebarProp,
    sidebarOpen: sidebarOpenProp,
    className = '',
    layoutId = 'chat-layout',
    getContext,
    extraTools,
    extraToggles,
    engine: externalEngine,
    composerPortal,
    initialProvider,
    initialModel,
    initialSystemPrompt,
    context,
    initialSearchToolsEnabled,
    initialPageToolsEnabled,
    initialImageToolsEnabled,
    initialVfsToolsEnabled,
    initialPrompt,
    initialAutoSend,
}) => {
    const defaults = PRESET_DEFAULTS[preset];
    const hasHeader = showHeaderProp ?? defaults.showHeader;
    const hasSidebar = showSidebarProp ?? defaults.showSidebar;

    const ownEngine = useChatEngine(preset);
    const engine = externalEngine || ownEngine;
    const isMobile = useIsMobile();

    // Wire external context and tools providers into the engine synchronously
    // (skipped when an external engine is provided — caller handles wiring)
    if (!externalEngine) {
        engine.contextProviderRef.current = getContext ?? null;
        engine.extraToolsRef.current = extraTools ?? null;
    }

    // One-shot: seed initial provider/model/systemPrompt/tools on first mount
    useEffect(() => {
        if (externalEngine) return;
        if (initialProvider !== undefined) engine.setProvider(initialProvider);
        if (initialModel !== undefined) engine.setModel(initialModel);

        // System prompt: explicit prop wins; otherwise assemble from defaults + context
        const resolvedPrompt = initialSystemPrompt ?? buildSupportPrompt(context);
        engine.setSystemPrompt(resolvedPrompt);
        if (initialSearchToolsEnabled !== undefined) engine.setToolsEnabled(initialSearchToolsEnabled);
        if (initialPageToolsEnabled !== undefined) engine.setPageToolsEnabled(initialPageToolsEnabled);
        if (initialImageToolsEnabled !== undefined) engine.setImageToolsEnabled(initialImageToolsEnabled);
        if (initialVfsToolsEnabled !== undefined) engine.setVfsToolsEnabled(initialVfsToolsEnabled);

        // Pre-fill the composer if a prompt is provided
        if (initialPrompt) {
            engine.setInput(initialPrompt);
            if (initialAutoSend) {
                setTimeout(() => {
                    engine.sendMessage(initialPrompt);
                }, 100);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Override sidebar initial state based on preset (only on mount)
    const sidebarInitial = sidebarOpenProp ?? defaults.sidebarOpen;
    // The engine already persists showSettings — but for 'simple' we force it off
    const showSettings = hasSidebar ? engine.showSettings : false;

    return (
        <div className={`flex flex-col h-full min-w-0 w-full ${className}`}>
            {/* Header */}
            {hasHeader && (
                <div className="flex-shrink-0 pb-2">
                    <ChatHeader
                        provider={engine.provider}
                        model={engine.model}
                        messages={engine.messages}
                        attachments={engine.attachments}
                        showSettings={showSettings}
                        onToggleSettings={hasSidebar
                            ? () => engine.setShowSettings(v => !v)
                            : () => { }
                        }
                        onExportJson={engine.handleExportJson}
                        onExportMarkdown={engine.handleExportMarkdown}
                        onClear={engine.handleClear}
                        onNewSession={engine.handleNewSession}
                    />
                </div>
            )}

            {/* Main area */}
            <div className="flex flex-1 min-h-0 min-w-0 relative w-full">
                {/* Mobile sidebar (Sheet) */}
                {hasSidebar && isMobile && (
                    <div className="md:hidden">
                        <Sheet open={showSettings} onOpenChange={engine.setShowSettings}>
                            <SheetContent side="left" className="w-[85vw] max-w-[360px] p-0 sm:max-w-[400px]">
                                <ChatSidebar {...sidebarProps(engine)} extraToggles={extraToggles} />
                            </SheetContent>
                        </Sheet>
                    </div>
                )}

                {/* Desktop: resizable panel layout */}
                <div className="hidden md:flex flex-1 min-h-0 min-w-0 w-full overflow-hidden">
                    <ResizablePanelGroup
                        direction="horizontal"
                        autoSaveId={layoutId}
                        className="h-full"
                    >
                        {hasSidebar && showSettings && !isMobile && (
                            <>
                                <ResizablePanel defaultSize={25} id="chat-sidebar" order={1}>
                                    <ChatSidebar {...sidebarProps(engine)} extraToggles={extraToggles} />
                                </ResizablePanel>
                                <ResizableHandle withHandle />
                            </>
                        )}
                        <ResizablePanel defaultSize={75} id="chat-main" order={2}>
                            <ChatMessages engine={engine} composerPortal={composerPortal} layoutId={layoutId} />
                        </ResizablePanel>
                    </ResizablePanelGroup>
                </div>

                {/* Mobile: full-width chat */}
                <div className="flex-1 flex flex-col min-h-0 min-w-0 w-full overflow-hidden md:hidden">
                    <ChatMessages engine={engine} composerPortal={composerPortal} layoutId={layoutId} />
                </div>
            </div>
        </div>
    );
};

export { ChatPanel, ChatMessages };
export default ChatPanel;
