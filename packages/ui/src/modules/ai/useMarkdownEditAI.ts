/**
 * useMarkdownEditAI — hooks into ChatPanel for markdown editing
 *
 * Mirrors the usePageEditAI pattern:
 *   - Instantiates useChatEngine
 *   - Wires context (document content + selection) into the system prompt
 *   - Wires extra markdown manipulation tools
 *   - Exposes engine, toggles, and extra sidebar JSX
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { translate } from '@/i18n';
import { Switch } from '@/components/ui/switch';
import { FileEdit } from 'lucide-react';
import { useChatEngine } from '@/modules/ai/useChatEngine';
import { createMarkdownTools, type MarkdownMutator, type MarkdownAction } from '@/modules/ai/markdownTools';

export interface MarkdownEditAIParams {
    /** Current markdown document content */
    content: string;
    /** Currently selected text in the editor */
    selectedText: string;
    /** Callback to set editor content (full replace) */
    onContentChange: (newContent: string) => void;
    /** Ref to the markdown editor instance (for insertMarkdown) */
    editorRef: React.MutableRefObject<any>;
    /** Optional template/context variables */
    contextVariables?: Record<string, any>;
}

export function useMarkdownEditAI({
    content,
    selectedText,
    onContentChange,
    editorRef,
    contextVariables,
}: MarkdownEditAIParams) {
    const chatEngine = useChatEngine();

    const [markdownToolsEnabled, setMarkdownToolsEnabled] = useState(() => {
        try { return localStorage.getItem('md-chat-markdown-tools') !== 'false'; } catch { return true; }
    });

    // Stable refs so tool closures always see latest state
    const contentRef = useRef(content);
    const selectedTextRef = useRef(selectedText);
    contentRef.current = content;
    selectedTextRef.current = selectedText;

    // Snapshot: frozen at send time so tools operate on the state the user
    // saw when they hit Send, not the possibly-changed state at tool execution.
    const snapshotRef = useRef({ content: '', selectedText: '' });

    // ── Mutator: performs the actual editor content updates ────────────
    const mutatorRef = useRef<MarkdownMutator | null>(null);

    /** Sync both React state AND the MDXEditor Lexical instance */
    const applyContent = useCallback((newContent: string) => {
        onContentChange(newContent);
        // MDXEditor ref exposes setMarkdown() to sync its internal Lexical state
        try { editorRef.current?.setMarkdown(newContent); } catch { /* editor may be unmounted */ }
    }, [onContentChange, editorRef]);

    const handleMutation = useCallback((action: MarkdownAction): boolean => {
        // Use snapshot (frozen at send) for reads, live contentRef for appends
        const snap = snapshotRef.current;

        /** Clean + sanitize AI output, warn if bare `<` was escaped */
        const prepare = (raw: string): string => {
            const cleaned = cleanMarkdownFences(raw);
            const { text, hadIssues } = sanitizeMdxContent(cleaned);
            if (hadIssues) {
                toast.warning(
                    translate('AI output contained invalid characters ("<") that were auto-escaped. Switch to the Markdown tab to review.'),
                    { duration: 6000 },
                );
            }
            return text;
        };

        switch (action.type) {
            case 'replace_content': {
                const content = prepare(action.content);
                applyContent(content);
                toast.success(translate('Document content replaced'));
                return true;
            }
            case 'append_content': {
                const content = prepare(action.content);
                const sep = action.separator ?? '\n\n';
                // Use live content for append (user may have typed more)
                const current = contentRef.current;
                const newContent = current && current.trim()
                    ? `${current}${sep}${content}`
                    : content;
                applyContent(newContent);
                toast.success(translate('Content appended'));
                return true;
            }
            case 'insert_at_cursor': {
                // MDXEditor doesn't expose cursor position externally,
                // so we append at end (same as the handleTextInsert pattern)
                const content = prepare(action.content);
                const current = contentRef.current;
                const newContent = current && current.trim()
                    ? `${current}\n\n${content}`
                    : content;
                applyContent(newContent);
                toast.success(translate('Content inserted'));
                return true;
            }
            case 'replace_selection': {
                const content = prepare(action.content);
                // Use snapshotted selection (what user had selected at send time)
                const sel = snap.selectedText;
                if (!sel || !sel.trim()) {
                    toast.warning(translate('No text selected — appending instead'));
                    const current = contentRef.current;
                    const newContent = current ? `${current}\n\n${content}` : content;
                    applyContent(newContent);
                    return true;
                }
                // Replace in snapshotted content, then set it
                const base = snap.content || contentRef.current;
                const newContent = base.replace(sel, content);
                applyContent(newContent);
                toast.success(translate('Selection replaced'));
                return true;
            }
            default:
                return false;
        }
    }, [applyContent]);

    mutatorRef.current = handleMutation;

    // ── Wire context provider ────────────────────────────────────────────
    useEffect(() => {
        chatEngine.contextProviderRef.current = () => {
            // ★ Snapshot editor state at send time
            snapshotRef.current = {
                content: contentRef.current,
                selectedText: selectedTextRef.current,
            };

            const parts: string[] = [];

            // Document snapshot (truncate for token budget)
            const doc = snapshotRef.current.content;
            if (doc && doc.trim()) {
                const truncated = doc.length > 6000
                    ? doc.substring(0, 6000) + '\n\n... (document truncated)'
                    : doc;
                parts.push(`## Current Document\n\`\`\`markdown\n${truncated}\n\`\`\``);
            } else {
                parts.push('## Current Document\n_The document is empty._');
            }

            // Selection
            const sel = snapshotRef.current.selectedText;
            if (sel && sel.trim()) {
                parts.push(`## Selected Text\n\`\`\`\n${sel}\n\`\`\``);
            }

            // Context variables — explain the ${name} substitution syntax
            if (contextVariables && Object.keys(contextVariables).length > 0) {
                parts.push(
                    `## Available Template Variables\nYou may reference these with \${name} syntax inside the markdown content. At render time they will be substituted with their current values.\nCurrent values:\n\`\`\`json\n${JSON.stringify(contextVariables, null, 2)}\n\`\`\`\nUse the actual values above to understand the context, but prefer \${variableName} placeholders in content so it stays dynamic.`
                );
            }

            // Custom markdown components — point to tools, not syntax
            parts.push(
                `## Custom Markdown Components\n` +
                `### Gallery\n` +
                `To insert a picture gallery, use the \`find_pictures\` tool to search for pictures, ` +
                `then call the \`insert_gallery\` tool with the picture IDs. ` +
                `Do NOT try to write gallery markdown yourself. Use it only when asked explicitly.`
            );

            return parts.join('\n\n');
        };

        return () => { chatEngine.contextProviderRef.current = null; };
    }, [contextVariables]);

    // ── Wire extra tools ─────────────────────────────────────────────────
    useEffect(() => {
        if (!markdownToolsEnabled) {
            chatEngine.extraToolsRef.current = null;
            return;
        }
        chatEngine.extraToolsRef.current = () =>
            createMarkdownTools(mutatorRef, (level, message, data) =>
                chatEngine.addChatLog(level as any, message, data));

        return () => { chatEngine.extraToolsRef.current = null; };
    }, [markdownToolsEnabled]);

    // ── Extra toggles JSX for the chat sidebar ───────────────────────────
    const chatExtraToggles = React.createElement(React.Fragment, null,
        React.createElement('div', { className: 'flex items-center justify-between' },
            React.createElement('div', { className: 'flex items-center gap-2' },
                React.createElement(FileEdit, { className: 'h-4 w-4 text-muted-foreground' }),
                React.createElement('label', {
                    htmlFor: 'md-tools-toggle',
                    className: 'text-sm cursor-pointer',
                }, 'Markdown Tools'),
            ),
            React.createElement(Switch, {
                id: 'md-tools-toggle',
                checked: markdownToolsEnabled,
                onCheckedChange: (v: boolean) => {
                    setMarkdownToolsEnabled(v);
                    try { localStorage.setItem('md-chat-markdown-tools', String(v)); } catch { }
                },
                disabled: chatEngine.isGenerating,
            }),
        ),
        markdownToolsEnabled ? React.createElement('div', { className: 'space-y-0.5 pl-6' },
            ...(['replace_content', 'append_content', 'insert_at_cursor', 'replace_selection'] as const).map(name =>
                React.createElement('div', { key: name, className: 'text-[11px] text-muted-foreground' },
                    React.createElement('code', { className: 'text-[10px] text-primary/70' }, name),
                )
            ),
        ) : null,
    );

    return {
        chatEngine,
        markdownToolsEnabled,
        chatExtraToggles,
    };
}

// ── Helpers ──────────────────────────────────────────────────────────────

/** Strip markdown code fences that LLMs sometimes wrap responses in */
function cleanMarkdownFences(text: string): string {
    // Only strip an outer "```markdown ... ```" wrapper the LLM sometimes adds.
    // Do NOT strip internal code fences (custom-gallery, js, etc.).
    const trimmed = text.trim();
    const outerFence = /^```(?:markdown)?\s*\n([\s\S]*?)\n```\s*$/i;
    const match = trimmed.match(outerFence);
    if (match) {
        return match[1].trim();
    }
    return trimmed;
}

/**
 * Known HTML tags that MDXEditor's JSX parser considers valid.
 * Bare `<` that don't start one of these are escaped to `&lt;`.
 */
const VALID_HTML_TAG = /^<\/?(a|abbr|address|area|article|aside|audio|b|base|bdi|bdo|blockquote|body|br|button|canvas|caption|cite|code|col|colgroup|data|datalist|dd|del|details|dfn|dialog|div|dl|dt|em|embed|fieldset|figcaption|figure|footer|form|h[1-6]|head|header|hgroup|hr|html|i|iframe|img|input|ins|kbd|label|legend|li|link|main|map|mark|menu|meta|meter|nav|noscript|object|ol|optgroup|option|output|p|param|picture|pre|progress|q|rp|rt|ruby|s|samp|script|search|section|select|slot|small|source|span|strong|sub|summary|sup|table|tbody|td|template|textarea|tfoot|th|thead|time|title|tr|track|u|ul|var|video|wbr)(\s|>|\/|$)/i;

/**
 * Sanitize markdown content for MDXEditor compatibility.
 *
 * MDXEditor treats `<` as JSX — bare angle brackets that don't form valid
 * HTML/JSX tags crash the parser and blank the editor.  This function
 * escapes those bare `<` while leaving code blocks/fences and legitimate
 * HTML tags untouched.
 *
 * Returns the sanitized text and whether any fixes were applied.
 */
function sanitizeMdxContent(text: string): { text: string; hadIssues: boolean } {
    let hadIssues = false;

    // Split on fenced code blocks to protect them
    const parts = text.split(/(```[\s\S]*?```)/g);

    const sanitized = parts.map((part, i) => {
        // Odd indices are code fences — leave untouched
        if (i % 2 === 1) return part;

        // Within prose, escape bare `<` that aren't valid HTML tags.
        // Also protect inline code spans.
        // The replace callback gets (match, group1, group2, offset).
        return part.replace(/(`[^`]*`)|(<)/g, (match, inlineCode, _ab, offset) => {
            if (inlineCode) return inlineCode; // inside inline code — keep
            // `<` found — check what follows it via offset
            const rest = part.slice(offset + 1);
            // Build a small lookahead from the rest of the string starting at this `<`
            const lookahead = '<' + rest.slice(0, 30);
            if (VALID_HTML_TAG.test(lookahead)) return '<'; // valid tag — keep
            // Also allow HTML comments <!-- -->
            if (rest.startsWith('!--')) return '<';
            hadIssues = true;
            return '&lt;';
        });
    }).join('');

    return { text: sanitized, hadIssues };
}
