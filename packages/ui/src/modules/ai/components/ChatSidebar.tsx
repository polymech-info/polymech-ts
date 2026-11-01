/**
 * ChatSidebar — settings panel with collapsible sections for
 * sessions, provider, system prompt, tools, stats, and logs.
 */

import React, { useState, useCallback } from 'react';
import { Plus, X, Copy, Check, Braces } from 'lucide-react';
import { T, translate } from '@/i18n';
import { Textarea } from '@/components/ui/textarea';

import { ProviderSelector } from '@/components/filters/ProviderSelector';
import CollapsibleSection from '@/components/CollapsibleSection';
import ChatLogBrowser, { CompactTreeView } from '@/components/ChatLogBrowser';
import FileBrowser from '@/modules/storage/FileBrowser';
import ToolSections from './ToolSections';
import type { ChatMessage, FileContext } from '../types';
import type { INode } from '@/modules/storage/types';
import { getMimeCategory } from '@/modules/storage/helpers';
import type { LogEntry } from '@/contexts/LogContext';
import type { ChatSession } from '../chatSessions';

interface ChatSidebarProps {
    provider: string;
    model: string;
    onProviderChange: (p: string) => void;
    onModelChange: (m: string) => void;
    systemPrompt: string;
    onSystemPromptChange: (v: string) => void;
    toolsEnabled: boolean;
    onToolsEnabledChange: (v: boolean) => void;
    pageToolsEnabled: boolean;
    onPageToolsEnabledChange: (v: boolean) => void;
    imageToolsEnabled: boolean;
    onImageToolsEnabledChange: (v: boolean) => void;
    imageModel: string;
    onImageModelChange: (model: string) => void;
    vfsToolsEnabled: boolean;
    onVfsToolsEnabledChange: (v: boolean) => void;
    webSearchEnabled: boolean;
    onWebSearchEnabledChange: (v: boolean) => void;
    extraToggles?: React.ReactNode;
    isGenerating: boolean;
    messages: ChatMessage[];
    user: any;
    chatLogs: LogEntry[];
    onClearLogs: () => void;
    lastApiMessages: any[];
    // Sessions
    sessionId: string;
    sessions: Omit<ChatSession, 'messages'>[];
    onNewSession: () => void;
    onLoadSession: (id: string) => void;
    onDeleteSession: (id: string) => void;
    // File context
    fileContexts?: FileContext[];
    addFileContext?: (path: string, mount?: string) => void;
    removeFileContext?: (path: string) => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
    provider, model, onProviderChange, onModelChange,
    systemPrompt, onSystemPromptChange,
    toolsEnabled, onToolsEnabledChange,
    pageToolsEnabled, onPageToolsEnabledChange,
    imageToolsEnabled, onImageToolsEnabledChange,
    imageModel, onImageModelChange,
    vfsToolsEnabled, onVfsToolsEnabledChange,
    webSearchEnabled, onWebSearchEnabledChange,
    extraToggles,
    isGenerating, messages, user, chatLogs, onClearLogs,
    lastApiMessages,
    sessionId, sessions, onNewSession, onLoadSession, onDeleteSession,
    fileContexts, addFileContext, removeFileContext,
}) => {
    const [copied, setCopied] = useState(false);
    const [copiedLogs, setCopiedLogs] = useState(false);
    const [selectedNode, setSelectedNode] = useState<INode | null>(null);
    const [selectedMount, setSelectedMount] = useState<string>('home');

    const handleFileSelect = useCallback((node: INode | null, mount?: string) => {
        setSelectedNode(node);
        if (mount) setSelectedMount(mount);
    }, []);

    const handleCopyPayload = useCallback(() => {
        if (!lastApiMessages) return;
        navigator.clipboard.writeText(JSON.stringify(lastApiMessages, null, 2));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [lastApiMessages]);

    const handleCopyLogs = useCallback(() => {
        if (!chatLogs.length) return;
        const logsJson = JSON.stringify(chatLogs.map(l => ({
            level: l.level,
            message: l.message,
            timestamp: l.timestamp instanceof Date ? l.timestamp.toISOString() : l.timestamp,
            ...(l.data !== undefined ? { data: l.data } : {}),
        })), null, 2);
        navigator.clipboard.writeText(logsJson);
        setCopiedLogs(true);
        setTimeout(() => setCopiedLogs(false), 2000);
    }, [chatLogs]);

    return (
        <div className="flex-shrink-0 space-y-2 overflow-y-auto w-full h-full p-2">
            {/* Sessions */}
            <CollapsibleSection title={translate("Sessions")} storageKey="chat-section-sessions" minimal>
                <div className="space-y-0.5">
                    <div
                        className="flex items-center gap-1.5 px-2 py-1.5 cursor-pointer hover:bg-muted/50 transition-colors text-xs text-muted-foreground hover:text-foreground"
                        onClick={onNewSession}
                    >
                        <Plus className="h-3.5 w-3.5" />
                        <span><T>New Chat</T></span>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                        {sessions.length === 0 ? (
                            <div className="px-3 py-2 text-xs text-muted-foreground text-center"><T>No saved sessions</T></div>
                        ) : (
                            sessions.map(s => (
                                <div
                                    key={s.id}
                                    className={`flex items-center gap-1.5 px-2 py-1 cursor-pointer transition-colors group hover:bg-muted/50
                                        ${s.id === sessionId ? 'bg-primary/10 border-l-2 border-l-primary' : ''}`}
                                    onClick={() => onLoadSession(s.id)}
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs font-medium truncate leading-tight">{s.title}</div>
                                        <div className="text-[10px] text-muted-foreground leading-tight">
                                            {new Date(s.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            {' '}
                                            {new Date(s.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onDeleteSession(s.id); }}
                                        className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all flex-shrink-0"
                                        title={translate("Delete")}
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </CollapsibleSection>

            {/* Provider */}
            <CollapsibleSection title={translate("Provider & Model")} storageKey="chat-section-provider" minimal>
                <div className="p-3 space-y-3">
                    <ProviderSelector
                        provider={provider}
                        model={model}
                        onProviderChange={onProviderChange}
                        onModelChange={onModelChange}
                        disabled={isGenerating}
                        showManagement={true}
                    />
                </div>
            </CollapsibleSection>

            {/* System prompt */}
            <CollapsibleSection title={translate("System Prompt")} storageKey="chat-section-system" minimal initiallyOpen={false}>
                <div className="p-3">
                    <Textarea
                        value={systemPrompt}
                        onChange={e => onSystemPromptChange(e.target.value)}
                        placeholder={translate("You are a helpful assistant...")}
                        rows={4}
                        className="resize-none text-sm"
                        disabled={isGenerating}
                        data-testid="chat-system-prompt"
                    />
                </div>
            </CollapsibleSection>

            {/* Tools — individual collapsible sections */}
            <CollapsibleSection title={translate("Tools")} storageKey="chat-section-tools" minimal>
                <ToolSections
                    storagePrefix="chat-tool"
                    toolsEnabled={toolsEnabled}
                    onToolsEnabledChange={onToolsEnabledChange}
                    pageToolsEnabled={pageToolsEnabled}
                    onPageToolsEnabledChange={onPageToolsEnabledChange}
                    imageToolsEnabled={imageToolsEnabled}
                    onImageToolsEnabledChange={onImageToolsEnabledChange}
                    imageModel={imageModel}
                    onImageModelChange={onImageModelChange}
                    vfsToolsEnabled={vfsToolsEnabled}
                    onVfsToolsEnabledChange={onVfsToolsEnabledChange}
                    webSearchEnabled={webSearchEnabled}
                    onWebSearchEnabledChange={onWebSearchEnabledChange}
                    isGenerating={isGenerating}
                    extraToggles={extraToggles}
                />
            </CollapsibleSection>

            {/* Files */}
            <CollapsibleSection title={translate("Files")} storageKey="chat-section-files" minimal initiallyOpen={false}>
                <div style={{ height: 'min(500px, 60vh)', display: 'flex', flexDirection: 'column' }}>
                    <FileBrowser disableRoutingSync={true}
                        allowPanels={false}
                        mode='simple'
                        onSelect={handleFileSelect} />
                </div>
                {selectedNode && getMimeCategory(selectedNode) !== 'dir' && addFileContext && (
                    <div className="px-2 py-1.5 border-t border-border flex items-center gap-2">
                        <span className="text-xs font-mono text-muted-foreground truncate flex-1">{selectedNode.name}</span>
                        <button
                            onClick={() => { addFileContext(selectedNode.path, selectedMount); setSelectedNode(null); }}
                            className="text-[11px] px-2 py-0.5 rounded bg-teal-600/20 text-teal-400 hover:bg-teal-600/30 border border-teal-600/30 flex-shrink-0"
                        >
                            <T>Attach</T>
                        </button>
                    </div>
                )}
                {fileContexts && fileContexts.length > 0 && (
                    <div className="p-2 border-t border-border space-y-1">
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider"><T>Attached</T> ({fileContexts.length})</div>
                        {fileContexts.map(fc => (
                            <div key={`${fc.mount}:${fc.path}`} className="flex items-center gap-1 text-xs font-mono text-teal-400 group">
                                <span className="truncate flex-1">{fc.path}</span>
                                {removeFileContext && (
                                    <button
                                        onClick={() => removeFileContext(fc.path)}
                                        className="p-0.5 rounded hover:bg-destructive/20 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </CollapsibleSection>

            {/* Prompt Payload */}
            {lastApiMessages && lastApiMessages.length > 0 && (
                <CollapsibleSection
                    title={`${translate("Prompt Payload")} (${lastApiMessages.length})`}
                    storageKey="chat-section-payload"
                    minimal
                    initiallyOpen={false}
                    headerContent={
                        <button
                            onClick={(e) => { e.stopPropagation(); handleCopyPayload(); }}
                            className="p-0.5 rounded hover:bg-muted transition-colors"
                            title={translate("Copy payload JSON")}
                        >
                            {copied
                                ? <Check className="h-3 w-3 text-green-500" />
                                : <Copy className="h-3 w-3 text-muted-foreground" />
                            }
                        </button>
                    }
                >
                    <div className="min-h-[180px]" style={{ height: 'clamp(180px, 35vh, 400px)' }}>
                        <CompactTreeView
                            data={lastApiMessages}
                            onExit={() => { }}
                            header={
                                <div className="flex items-center gap-1.5 px-2 py-1.5 border-b bg-muted/20 flex-shrink-0">
                                    <Braces className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-[10px] font-semibold text-muted-foreground">
                                        {lastApiMessages.length} {translate("messages in context")}
                                    </span>
                                </div>
                            }
                        />
                    </div>
                </CollapsibleSection>
            )}

            {/* Logs */}
            <CollapsibleSection
                title={translate("Chat Logs")}
                storageKey="chat-section-logs"
                minimal
                headerContent={
                    chatLogs.length > 0 ? (
                        <button
                            onClick={(e) => { e.stopPropagation(); handleCopyLogs(); }}
                            className="p-0.5 rounded hover:bg-muted transition-colors"
                            title={translate("Copy logs JSON")}
                        >
                            {copiedLogs
                                ? <Check className="h-3 w-3 text-green-500" />
                                : <Copy className="h-3 w-3 text-muted-foreground" />
                            }
                        </button>
                    ) : undefined
                }
            >
                <div className="min-h-[180px]" style={{ height: 'clamp(180px, 35vh, 400px)' }}>
                    <ChatLogBrowser logs={chatLogs} clearLogs={onClearLogs} title={translate("Chat Logs")} />
                </div>
            </CollapsibleSection>
        </div>
    );
};

export default ChatSidebar;
