/**
 * useChatEngine — custom hook encapsulating all chat state & logic
 *
 * Handles messages, attachments, API key resolution, streaming,
 * tool-calling, prompt history, and logging.
 */

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import OpenAI from 'openai';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { usePromptHistory } from '@/hooks/usePromptHistory';
import { useDragDrop } from '@/contexts/DragDropContext';
import { getProviderConfig } from '@/modules/providers/client-providers';
import { serverUrl } from '@/lib/db';
import { createOpenAIClient } from '@/lib/openai';
import { createSearchToolPreset, createWebSearchToolPreset } from '@/modules/ai/searchTools';
import { createPageTool } from '@/lib/pageTools';
import { createImageTool } from '@/modules/ai/imageTools';
import { createVfsTools } from '@/modules/ai/vfsTools';
import { LogEntry } from '@/contexts/LogContext';
import { ChatMessage, ImageAttachment, FileContext, fileToDataUrl, getResizedImageUrl } from './types';
import { exportChatAsJson, exportChatAsMarkdown } from './chatExport';
import { listSessions, loadSession as loadSessionData, saveSession, deleteSession as deleteSessionData, generateSessionTitle, ChatSession } from './chatSessions';
import { useVoiceInput } from '@/hooks/useVoiceInput';


// ── localStorage-backed state ────────────────────────────────────────────

function usePersisted<T>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [value, setValue] = useState<T>(() => {
        try {
            const stored = localStorage.getItem(key);
            return stored !== null ? JSON.parse(stored) : defaultValue;
        } catch { return defaultValue; }
    });
    useEffect(() => {
        try { localStorage.setItem(key, JSON.stringify(value)); } catch { }
    }, [key, value]);
    return [value, setValue];
}

export function useChatEngine(namespace = 'chat') {
    const { user } = useAuth();
    const { setLocalZoneActive, resetDragState } = useDragDrop();

    // ── State ────────────────────────────────────────────────────────────
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [attachments, setAttachments] = useState<ImageAttachment[]>([]);
    const [showImagePicker, setShowImagePicker] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [provider, setProvider] = usePersisted(`${namespace}-settings-provider`, 'openai');
    const [model, setModel] = usePersisted(`${namespace}-settings-model`, 'gpt-5');
    const [systemPrompt, setSystemPrompt] = usePersisted(
        `${namespace}-settings-system-prompt`,
        'You are a helpful assistant. Be concise and clear. Always return Markdown raw with additional escapes ticks except for code'
    );
    const [toolsEnabled, setToolsEnabled] = usePersisted(`${namespace}-settings-tools`, true);
    const [pageToolsEnabled, setPageToolsEnabled] = usePersisted(`${namespace}-settings-page-tools`, true);
    const [imageToolsEnabled, setImageToolsEnabled] = usePersisted(`${namespace}-settings-image-tools`, false);
    const [imageModel, setImageModel] = usePersisted(`${namespace}-settings-image-model`, 'google/gemini-3-pro-image-preview');
    const [vfsToolsEnabled, setVfsToolsEnabled] = usePersisted(`${namespace}-settings-vfs-tools`, false);
    const [webSearchEnabled, setWebSearchEnabled] = usePersisted(`${namespace}-settings-web-search`, false);
    const [showSettings, setShowSettings] = usePersisted(`${namespace}-settings-show`, true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [chatLogs, setChatLogs] = useState<LogEntry[]>([]);
    const [fileContexts, setFileContexts] = useState<FileContext[]>([]);

    const handleVoiceRecordComplete = useCallback((text: string) => {
        setInput(prev => prev ? prev + ' ' + text : text);
    }, []);

    const { isRecording, isTranscribing, handleMicrophoneToggle } = useVoiceInput(handleVoiceRecordComplete);


    // Build the effective system prompt (base + attached file contexts)
    const effectiveSystemPrompt = useMemo(() => {
        let prompt = systemPrompt.trim();
        if (fileContexts.length > 0) {
            prompt += '\n\n--- Attached Files (editable via fs_write) ---\n';
            for (const fc of fileContexts) {
                prompt += `\n### ${fc.mount}:/${fc.path}\n\`\`\`\n${fc.content}\n\`\`\`\n`;
            }
        }
        return prompt;
    }, [systemPrompt, fileContexts]);

    // Refs
    const abortRef = useRef<AbortController | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const composerRef = useRef<HTMLDivElement>(null);

    const contextProviderRef = useRef<(() => string | null) | null>(null);
    const extraToolsRef = useRef<(() => any[]) | null>(null);

    // Live-computed API payload for the inspector (always reflects current state)
    const lastApiMessages = useMemo(() => {
        const result: any[] = [];
        let sysPrompt = effectiveSystemPrompt;
        let extContext = "";

        if (contextProviderRef.current) {
            const ext = contextProviderRef.current();
            if (ext) extContext = ext;
        }

        if (sysPrompt) result.push({ role: 'system', content: sysPrompt });
        if (extContext) result.push({ role: 'user', content: `--- PAGE CONTEXT ---\n${extContext}\n--- END PAGE CONTEXT ---` });
        for (const m of messages) {
            if (m.role === 'system' || m.role === 'tool') continue;
            
            const hasImages = m.images && m.images.length > 0;
            
            if (hasImages) {
                const contentParts: any[] = [];
                if (m.content) contentParts.push({ type: 'text', text: m.content });
                if (m.toolContext) contentParts.push({ type: 'text', text: m.toolContext });
                
                for (const img of m.images!) {
                    contentParts.push({ type: 'image_url', image_url: { url: img.url } });
                }
                
                result.push({ role: m.role, content: contentParts });
            } else if (m.toolContext) {
                result.push({ role: m.role, content: m.content + '\n\n' + m.toolContext });
            } else {
                result.push({ role: m.role, content: m.content });
            }
        }
        return result;
    }, [effectiveSystemPrompt, messages]);

    // Sessions
    const [sessionId, setSessionId] = useState<string>(() => crypto.randomUUID());
    const [sessions, setSessions] = useState(() => listSessions());
    const refreshSessions = useCallback(() => setSessions(listSessions()), []);

    // Prompt history
    const {
        prompt: historyPrompt,
        setPrompt: setHistoryPrompt,
        promptHistory,
        historyIndex,
        navigateHistory,
        addPromptToHistory,
        setHistoryIndex,
    } = usePromptHistory('promptHistoryChat');

    // ── Logging ──────────────────────────────────────────────────────────
    const addChatLog = useCallback((level: string, message: string, data?: any) => {
        const mappedLevel = (level === 'warn' ? 'warning' : level) as LogEntry['level'];
        setChatLogs(prev => [...prev, {
            id: crypto.randomUUID(),
            timestamp: new Date(),
            level: mappedLevel,
            message,
            category: 'chat',
            ...(data !== undefined ? { data } : {}),
        }]);
    }, []);

    // ── File context handlers ────────────────────────────────────────────
    const addFileContext = useCallback(async (path: string, mount: string = 'home') => {
        // Skip if already attached
        if (fileContexts.some(fc => fc.path === path && fc.mount === mount)) {
            addChatLog('info', `File already attached: ${mount}:/${path}`);
            return;
        }
        try {
            const clean = path.replace(/^\/+/, '');
            const headers: Record<string, string> = {};
            // Reuse the auth pattern from useChatEngine's existing getClient
            try {
                const { getAuthToken } = await import('@/lib/db');
                const token = await getAuthToken();
                if (token) headers['Authorization'] = `Bearer ${token}`;
            } catch { }
            const res = await fetch(`${serverUrl}/api/vfs/read/${mount}/${clean}`, { headers });
            if (!res.ok) {
                const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
                addChatLog('error', `Failed to read file: ${err.error || res.status}`);
                toast.error(`Failed to read file: ${clean}`);
                return;
            }
            const content = await res.text();
            const name = clean.split('/').pop() || clean;
            const fc: FileContext = { path: clean, mount, name, content };
            setFileContexts(prev => [...prev, fc]);
            addChatLog('info', `Attached file context: ${mount}:/${clean} (${content.length} chars)`);
        } catch (err: any) {
            addChatLog('error', `Failed to attach file: ${err.message}`);
            toast.error(`Failed to attach file: ${path}`);
        }
    }, [fileContexts, addChatLog]);

    const removeFileContext = useCallback((path: string) => {
        setFileContexts(prev => prev.filter(fc => fc.path !== path));
    }, []);

    // ── Auto-scroll ─────────────────────────────────────────────────────
    const isUserScrolledUpRef = useRef(false);

    // Focus input on mount
    useEffect(() => {
        if (historyIndex >= 0 && historyPrompt) setInput(historyPrompt);
    }, [historyPrompt, historyIndex]);

    // ── Auto-save session ────────────────────────────────────────────────
    useEffect(() => {
        if (messages.length === 0) return;
        // Sanitize: strip streaming flags and remove empty orphan messages
        const clean = messages
            .filter(m => !(m.role === 'assistant' && !m.content && m.isStreaming))
            .map(m => m.isStreaming ? { ...m, isStreaming: false } : m);
        const session: ChatSession = {
            id: sessionId,
            title: generateSessionTitle(clean),
            createdAt: clean[0]?.timestamp || Date.now(),
            updatedAt: Date.now(),
            messages: clean,
        };
        saveSession(session);
        refreshSessions();
    }, [messages, sessionId, refreshSessions]);



    // ── API key / client ────────────────────────────────────────────────
    const getProviderApiKey = useCallback(
        async (prov: string): Promise<string | null> => {
            if (!user) return null;
            if (prov === 'openai') {
                // Return null since the createOpenAIClient will automatically grab
                return null;
            }
            try {
                const cfg = await getProviderConfig(user.id, prov);
                return (cfg?.settings as any)?.apiKey || null;
            } catch { return null; }
        },
        [user]
    );

    const getClient = useCallback(
        async (): Promise<OpenAI | null> => {
            if (provider === 'openai') {
                const key = await getProviderApiKey('openai');
                return createOpenAIClient(key || undefined);
            }
            if (provider === 'openrouter') {
                // Read from local session for proxy backend auth
                let token: string | undefined = undefined;
                try {
                    const { getAuthToken } = await import('@/lib/db');
                    token = await getAuthToken();
                } catch { }

                if (!token) return null;

                return new OpenAI({
                    apiKey: token, // This is sent as Bearer token to our proxy
                    baseURL: `${serverUrl}/api/openrouter/v1`,
                    dangerouslyAllowBrowser: true
                });
            }
            if (provider === 'support') {
                return new OpenAI({
                    apiKey: 'support-token-placeholder', // Ignored by proxy, but required by OpenAI SDK
                    baseURL: `${serverUrl}/api/support/v1`,
                    dangerouslyAllowBrowser: true
                });
            }
            return null;
        },
        [provider, getProviderApiKey]
    );

    // ── Attachment handlers ─────────────────────────────────────────────
    const addFilesAsAttachments = useCallback(async (files: File[]) => {
        const imageFiles = files.filter(f => f.type.startsWith('image/'));
        if (imageFiles.length === 0) {
            if (files.length > 0) toast.error('Only image files are supported');
            return;
        }
        const newAtt: ImageAttachment[] = [];
        for (const file of imageFiles) {
            try {
                const dataUrl = await fileToDataUrl(file);
                newAtt.push({ id: crypto.randomUUID(), url: dataUrl, name: file.name, isLocal: true });
            } catch (err) { console.error('Failed to read file:', err); }
        }
        setAttachments(prev => [...prev, ...newAtt]);
    }, []);

    const removeAttachment = useCallback((id: string) => {
        setAttachments(prev => prev.filter(a => a.id !== id));
    }, []);

    const handlePickerSelect = useCallback((pictures: any[]) => {
        const newAtt: ImageAttachment[] = pictures.map(pic => ({
            id: pic.id || crypto.randomUUID(),
            url: pic.image_url || pic.src,
            name: pic.title || 'Gallery image',
            isLocal: false,
        }));
        setAttachments(prev => {
            const existingIds = new Set(prev.map(a => a.id));
            return [...prev, ...newAtt.filter(a => !existingIds.has(a.id))];
        });
        setShowImagePicker(false);
    }, []);

    const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            addFilesAsAttachments(Array.from(e.target.files));
            e.target.value = '';
        }
    }, [addFilesAsAttachments]);

    const handlePaste = useCallback((e: React.ClipboardEvent) => {
        const items = e.clipboardData?.items;
        if (!items) return;
        const imageFiles: File[] = [];
        for (const item of Array.from(items)) {
            if (item.type.startsWith('image/')) {
                const file = item.getAsFile();
                if (file) imageFiles.push(file);
            }
        }
        if (imageFiles.length > 0) addFilesAsAttachments(imageFiles);
    }, [addFilesAsAttachments]);

    // ── Drag-drop ───────────────────────────────────────────────────────
    const handleDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer.types.includes('Files')) {
            setIsDragging(true);
            setLocalZoneActive(true);
        }
    }, [setLocalZoneActive]);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        if (composerRef.current && !composerRef.current.contains(e.relatedTarget as Node)) {
            setIsDragging(false);
            setLocalZoneActive(false);
        }
    }, [setLocalZoneActive]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    }, []);

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        resetDragState();
        await addFilesAsAttachments(Array.from(e.dataTransfer.files));
    }, [addFilesAsAttachments, resetDragState]);

    // ── Helpers: build API messages from chat history ───────────────────
    const buildApiMessages = useCallback((
        chatHistory: ChatMessage[],
        userMsg: ChatMessage,
    ): any[] => {
        let sysPrompt = effectiveSystemPrompt;
        let extContext = "";
        if (contextProviderRef.current) {
            const ext = contextProviderRef.current();
            console.log("🛠️ [buildApiMessages] contextProviderRef returned:", ext);
            if (ext) extContext = ext;
        } else {
            console.log("🛠️ [buildApiMessages] No contextProviderRef available!");
        }
        const apiMessages: any[] = [];
        if (sysPrompt) apiMessages.push({ role: 'system', content: sysPrompt });
        if (extContext) {
            apiMessages.push({ role: 'user', content: `--- PAGE CONTEXT ---\n${extContext}\n--- END PAGE CONTEXT ---` });
        }

        for (const m of [...chatHistory, userMsg]) {
            if (m.role === 'system' || m.role === 'tool') continue;
            
            const hasImages = m.images && m.images.length > 0;
            
            if (hasImages) {
                const contentParts: any[] = [];
                if (m.content) contentParts.push({ type: 'text', text: m.content });
                if (m.toolContext) contentParts.push({ type: 'text', text: m.toolContext });
                
                for (const img of m.images!) {
                    contentParts.push({ type: 'image_url', image_url: { url: getResizedImageUrl(img) } });
                }
                
                apiMessages.push({ role: m.role, content: contentParts });
            } else if (m.toolContext) {
                apiMessages.push({ role: m.role, content: m.content + '\n\n' + m.toolContext });
            } else {
                apiMessages.push({ role: m.role, content: m.content });
            }
        }
        return apiMessages;
    }, [effectiveSystemPrompt]);

    // ── Helpers: collect tools from built-in + external providers ─────
    const collectTools = useCallback((): any[] => {
        const allTools: any[] = [];
        console.log('[useChatEngine] collectTools called. toolsEnabled (search):', toolsEnabled, 'page:', pageToolsEnabled, 'image:', imageToolsEnabled, 'vfs:', vfsToolsEnabled, 'user:', !!user);

        if (toolsEnabled) {
            const searchPreset = createSearchToolPreset((level, message, data) => addChatLog(level as any, message, data));
            allTools.push(...searchPreset.tools);
        }

        if (webSearchEnabled) {
            const webPreset = createWebSearchToolPreset((level, message, data) => addChatLog(level as any, message, data));
            allTools.push(...webPreset.tools);
        }

        if (pageToolsEnabled && user) {
            allTools.push(createPageTool(user.id, (level, message, data) => addChatLog(level as any, message, data)));
        }

        if (imageToolsEnabled && user) {
            console.log('[useChatEngine] Adding image tool. User ID:', user.id, 'Model:', imageModel);
            allTools.push(createImageTool(user.id, (level, message, data) => addChatLog(level as any, message, data), imageModel));
        }

        if (vfsToolsEnabled) {
            allTools.push(...createVfsTools((level, message, data) => addChatLog(level as any, message, data)));
        }

        if (extraToolsRef.current) {
            const ext = extraToolsRef.current();
            console.log('[useChatEngine] Extra tools provided:', ext?.map((t: any) => t?.function?.name).join(', '));
            if (ext?.length) allTools.push(...ext);
        }

        console.log('[useChatEngine] Final tools collected:', allTools.map(t => t?.function?.name).join(', '));
        return allTools;
    }, [toolsEnabled, pageToolsEnabled, imageToolsEnabled, imageModel, vfsToolsEnabled, webSearchEnabled, user, addChatLog]);

    // ── Helpers: extract tool context from runner messages ────────────
    const extractToolContext = useCallback((runnerMsgs: any[]): string => {
        const toolResults: string[] = [];
        for (const msg of runnerMsgs) {
            if (msg.role === 'tool' && typeof msg.content === 'string') {
                try {
                    const parsed = JSON.parse(msg.content);
                    if (!parsed.success) continue;
                    if (parsed.category && parsed.items) {
                        const itemSummaries = parsed.items.map((it: any) => {
                            const vars = it.variables ? Object.entries(it.variables).map(([k, v]) => `${k}=${v}`).join(', ') : '';
                            return `- ${it.title} (${it.url})${vars ? ` [${vars}]` : ''}`;
                        }).join('\n');
                        toolResults.push(`Category "${parsed.category.name}" items:\n${itemSummaries}`);
                    } else if (parsed.results?.length || parsed.pages?.length) {
                        const items = parsed.results || parsed.pages;
                        const resSummaries = items.map((r: any) => `- ${r.title || r.name || '?'} (${r.url || r.slug || '?'})`).join('\n');
                        toolResults.push(`Search results:\n${resSummaries}`);
                    } else if (parsed.content) {
                        const label = parsed.title || parsed.slug || 'Document';
                        toolResults.push(`Page "${label}":\n${parsed.content.slice(0, 1000)}...`);
                    } else if (parsed.categories?.length) {
                        const catList = parsed.categories.map((c: any) => `- ${c.name} (slug: ${c.slug})${c.children?.length ? ` [${c.children.length} subcats]` : ''}`).join('\n');
                        toolResults.push(`Categories:\n${catList}`);
                    } else if (parsed.markdown && parsed.imageUrl) {
                        toolResults.push(`Generated image: ${parsed.imageUrl}\nMarkdown: ${parsed.markdown}`);
                    }
                } catch { }
            }
        }
        return toolResults.length > 0 ? `[Tool results from this response]\n${toolResults.join('\n\n')}` : '';
    }, []);

    // ── Helpers: run with tool-calling mode ───────────────────────────
    const runWithTools = useCallback(async (
        client: OpenAI,
        apiMessages: any[],
        allTools: any[],
        assistantId: string,
    ) => {
        addChatLog('info', `Tool mode started with ${allTools.length} tools, ${apiMessages.length} messages in context`);
        const runner = client.chat.completions.runTools({ model, messages: apiMessages, tools: allTools });

        runner.on('functionToolCall', (fnCall: any) => {
            let argsDisplay = fnCall.arguments;
            let argsData: any = undefined;
            try {
                argsData = JSON.parse(fnCall.arguments);
                argsDisplay = Object.entries(argsData).map(([k, v]) => `${k}=${JSON.stringify(v)}`).join(', ');
            } catch { }
            addChatLog('info', `🔧 ${fnCall.name}(${argsDisplay})`, argsData);
            const toolMsg: ChatMessage = {
                id: crypto.randomUUID(), role: 'tool',
                content: `Calling ${fnCall.name}(${argsDisplay})`,
                timestamp: Date.now(), toolName: fnCall.name,
            };
            setMessages(prev => {
                const idx = prev.findIndex(m => m.id === assistantId);
                if (idx === -1) return [...prev, toolMsg];
                const ret = [...prev.slice(0, idx), toolMsg, ...prev.slice(idx)];
                return ret;
            });
        });

        runner.on('functionToolCallResult', (result: any) => {
            try {
                const parsed = typeof result === 'string' ? JSON.parse(result) : result;
                if (!parsed.success) {
                    addChatLog('warn', `❌ Tool failed: ${parsed.error || 'Unknown error'}`);
                    return;
                }
                const lines: string[] = [];
                const total = parsed.total ?? parsed.results?.length ?? parsed.items?.length ?? parsed.categories?.length;
                lines.push(`✅ ${total != null ? `${total} results` : 'OK'}`);
                if (parsed.category) {
                    const c = parsed.category;
                    const varKeys = Object.keys(c.variables || {});
                    lines.push(`  📂 Category: ${c.name} (${c.slug})${varKeys.length ? ` — vars: ${varKeys.join(', ')}` : ''}`);
                }
                const items = parsed.items || parsed.results || parsed.categories || [];
                items.slice(0, 5).forEach((item: any, i: number) => {
                    const title = item.title || item.name || item.slug || '—';
                    const varKeys = Object.keys(item.variables || {});
                    const extras: string[] = [];
                    if (item.url) extras.push(item.url.replace(/^https?:\/\/[^/]+/, ''));
                    if (varKeys.length) extras.push(`vars: ${varKeys.slice(0, 6).join(', ')}${varKeys.length > 6 ? '…' : ''}`);
                    if (item.description) extras.push(`"${item.description.slice(0, 60)}${item.description.length > 60 ? '…' : ''}"`);
                    if (item.children?.length) extras.push(`${item.children.length} children`);
                    lines.push(`  ${i + 1}. ${title}${extras.length ? ` — ${extras.join(' | ')}` : ''}`);
                });
                if (items.length > 5) lines.push(`  … and ${items.length - 5} more`);
                if (parsed.content) lines.push(`  📄 Content: ${parsed.content.length} chars`);
                addChatLog('debug', `📋 ${lines.join('\n')}`, parsed);
            } catch { }
        });

        await runner.done();
        const finalContent = await runner.finalContent() || '';
        const toolContext = extractToolContext(runner.messages || []);

        addChatLog('info', `✅ Tool mode completed (${finalContent.length} chars${toolContext ? `, ${toolContext.length} chars context preserved` : ''})`);
        setMessages(prev => prev.map(m =>
            m.id === assistantId ? { ...m, content: finalContent, isStreaming: false, toolContext: toolContext || undefined } : m
        ));
    }, [model, addChatLog, extractToolContext]);

    // ── Helpers: run simple streaming (no tools) ─────────────────────
    const runStreaming = useCallback(async (
        client: OpenAI,
        apiMessages: any[],
        assistantId: string,
        signal: AbortSignal,
    ) => {
        addChatLog('info', `Streaming from ${provider}/${model}`);
        const stream = await client.chat.completions.create(
            { model, messages: apiMessages, stream: true },
            { signal }
        );
        let fullContent = '';
        for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta?.content || '';
            if (delta) {
                fullContent += delta;
                const snapshot = fullContent;
                setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: snapshot } : m));
            }
        }
        setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, isStreaming: false } : m));
        addChatLog('info', `✅ Stream completed (${fullContent.length} chars)`);
    }, [provider, model, addChatLog]);

    // ── Send message ────────────────────────────────────────────────────
    const sendMessage = useCallback(async (explicitText?: any) => {
        const textToUse = typeof explicitText === 'string' ? explicitText : input;
        const trimmed = textToUse.trim();
        if ((!trimmed && attachments.length === 0) || isGenerating) return;
        // if (!user) { toast.error('Please sign in to use AI features'); return; }
        const client = await getClient();
        if (!client) { toast.error('Could not create AI client. Check your provider settings.'); return; }

        if (trimmed) addPromptToHistory(trimmed);

        // Force scroll lock release on new message send
        isUserScrolledUpRef.current = false;

        const msgImages = [...attachments];
        const userMsg: ChatMessage = {
            id: crypto.randomUUID(), role: 'user', content: trimmed,
            timestamp: Date.now(), 
            images: msgImages.length > 0 ? msgImages : undefined,
        };
        const assistantId = crypto.randomUUID();
        const assistantMsg: ChatMessage = {
            id: assistantId, role: 'assistant', content: '', timestamp: Date.now(), isStreaming: true,
        };

        setMessages(prev => [...prev, userMsg, assistantMsg]);
        setInput('');
        setAttachments([]);
        setIsGenerating(true);
        const hasAnyToolsForLog = toolsEnabled || !!extraToolsRef.current;
        addChatLog('info', `Sending message (${provider}/${model})${msgImages.length ? ` with ${msgImages.length} image(s)` : ''}${hasAnyToolsForLog ? ' [tools: ON]' : ''}`, [...messages, userMsg, assistantMsg]);

        const abort = new AbortController();
        abortRef.current = abort;

        try {
            const apiMessages = buildApiMessages(messages, userMsg);
            const hasAnyTools = toolsEnabled || webSearchEnabled || pageToolsEnabled || imageToolsEnabled || vfsToolsEnabled || !!extraToolsRef.current;

            if (hasAnyTools) {
                const allTools = collectTools();
                await runWithTools(client, apiMessages, allTools, assistantId);
            } else {
                await runStreaming(client, apiMessages, assistantId, abort.signal);
            }
        } catch (err: any) {
            if (err.name === 'AbortError' || err.message?.includes('aborted')) {
                setMessages(prev => prev.map(m =>
                    m.id === assistantId ? { ...m, content: m.content || '*(cancelled)*', isStreaming: false } : m
                ));
                addChatLog('warn', 'Request cancelled by user');
                return;
            }
            console.error('[Chat] Error:', err);
            addChatLog('error', `Error: ${err.message}`);
            toast.error('Error: ' + err.message);
            setMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, content: `⚠️ Error: ${err.message}`, isStreaming: false } : m
            ));
        } finally {
            abortRef.current = null;
            setIsGenerating(false);
            inputRef.current?.focus();
        }
    }, [input, attachments, isGenerating, user, getClient, model, messages, toolsEnabled, provider, addChatLog, addPromptToHistory, buildApiMessages, collectTools, runWithTools, runStreaming]);

    // ── Cancel / Clear ──────────────────────────────────────────────────
    const handleCancel = useCallback(() => { abortRef.current?.abort(); }, []);

    const handleNewSession = useCallback(() => {
        setMessages([]);
        setAttachments([]);
        setChatLogs([]);
        setInput('');
        setHistoryIndex(-1);
        setSessionId(crypto.randomUUID());
        isUserScrolledUpRef.current = false;
        inputRef.current?.focus();
    }, [setHistoryIndex]);

    const handleClear = useCallback(() => {
        handleNewSession();
        addChatLog('info', 'Session cleared');
    }, [handleNewSession, addChatLog]);

    const handleLoadSession = useCallback((id: string) => {
        const session = loadSessionData(id);
        if (!session) return;
        setSessionId(session.id);
        // Sanitize: strip orphan streaming messages
        const clean = session.messages
            .filter(m => !(m.role === 'assistant' && !m.content && m.isStreaming))
            .map(m => m.isStreaming ? { ...m, isStreaming: false } : m);
        setMessages(clean);
        setChatLogs([]);
        setAttachments([]);
        setInput('');
        setHistoryIndex(-1);
        isUserScrolledUpRef.current = false;
        addChatLog('info', `Loaded session: ${session.title}`);
    }, [addChatLog, setHistoryIndex]);

    const handleDeleteSession = useCallback((id: string) => {
        deleteSessionData(id);
        refreshSessions();
        // If deleting current session, start fresh
        if (id === sessionId) handleNewSession();
    }, [sessionId, handleNewSession, refreshSessions]);

    // ── Export handlers ─────────────────────────────────────────────────
    const handleExportJson = useCallback(() => {
        exportChatAsJson(messages, chatLogs, provider, model, systemPrompt);
    }, [messages, chatLogs, provider, model, systemPrompt]);

    const handleExportMarkdown = useCallback(() => {
        exportChatAsMarkdown(messages, provider, model, systemPrompt);
    }, [messages, provider, model, systemPrompt]);

    // ── Key handling ────────────────────────────────────────────────────
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            } else if (e.key === 'ArrowUp' && e.ctrlKey) {
                e.preventDefault();
                navigateHistory('up');
            } else if (e.key === 'ArrowDown' && e.ctrlKey) {
                e.preventDefault();
                navigateHistory('down');
            }
        },
        [sendMessage, navigateHistory]
    );

    const canSend = (input.trim() || attachments.length > 0) && !isGenerating;

    return {
        // State
        messages, input, setInput, attachments, showImagePicker, setShowImagePicker, lastApiMessages, fileContexts,
        isDragging, provider, setProvider, model, setModel, systemPrompt, setSystemPrompt,
        toolsEnabled, setToolsEnabled, pageToolsEnabled, setPageToolsEnabled,
        imageToolsEnabled, setImageToolsEnabled, imageModel, setImageModel,
        vfsToolsEnabled, setVfsToolsEnabled,
        webSearchEnabled, setWebSearchEnabled,
        showSettings, setShowSettings, isGenerating, chatLogs, setChatLogs, user,
        // Sessions
        sessionId, sessions,
        // Refs
        scrollRef, inputRef, fileInputRef, composerRef, contextProviderRef, extraToolsRef,
        // Prompt history
        promptHistory, historyIndex, navigateHistory,
        // Handlers
        sendMessage, handleCancel, handleClear, handleNewSession,
        handleLoadSession, handleDeleteSession,
        handleExportJson, handleExportMarkdown,
        handleKeyDown, handlePaste, canSend,
        removeAttachment, handlePickerSelect, handleFileInputChange,
        handleDragEnter, handleDragLeave, handleDragOver, handleDrop,
        addChatLog, addFileContext, removeFileContext,
        isUserScrolledUpRef,
        isRecording, isTranscribing, handleMicrophoneToggle,
    };
}
