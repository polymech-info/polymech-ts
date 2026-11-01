/**
 * MessageBubble — renders a single chat message with avatar, copy button,
 * and MarkdownRenderer for assistant messages.
 */

import React, { useState, useCallback } from 'react';
import { Bot, User, Wrench, Loader2, Copy, Check, StopCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import type { ChatMessage } from '../types';

// ── Unescape markdown ────────────────────────────────────────────────────
// LLMs sometimes escape markdown chars (e.g. \! \* \[ \]) which breaks rendering.
const unescapeMarkdown = (text: string): string =>
    text.replace(/\\([!*[\]()#>_~`|])/g, '$1');

// ── Linkify helper ──────────────────────────────────────────────────────

const URL_REGEX = /(https?:\/\/[^\s<>"')\]]+)/g;
const URL_TEST = /^https?:\/\//;
const IMG_TEST = /\.(jpe?g|png|gif|webp|avif|svg|bmp)(\?|$)|\/api\/images\/render\?/i;

const linkifyContent = (text: string): React.ReactNode => {
    const parts = text.split(URL_REGEX);
    if (parts.length === 1) return text;
    return parts.map((part, i) => {
        if (!URL_TEST.test(part)) {
            return <React.Fragment key={i}>{part}</React.Fragment>;
        }
        if (IMG_TEST.test(part)) {
            return (
                <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="inline-block my-1">
                    <img
                        src={part}
                        alt="image"
                        className="rounded-lg border border-border max-w-[200px] max-h-[200px] object-cover hover:opacity-80 transition-opacity"
                        loading="lazy"
                    />
                </a>
            );
        }
        return (
            <a
                key={i}
                href={part}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-400 underline underline-offset-2 break-all"
            >
                {part}
            </a>
        );
    });
};

// ── Component ───────────────────────────────────────────────────────────

const MessageBubble: React.FC<{ message: ChatMessage; onCancel?: () => void }> = ({ message, onCancel }) => {
    const isUser = message.role === 'user';
    const isTool = message.role === 'tool';
    const [copied, setCopied] = useState(false);

    const handleCopy = useCallback(() => {
        if (!message.content) return;
        navigator.clipboard.writeText(message.content).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        });
    }, [message.content]);

    return (
        <div
            className={`flex gap-2 sm:gap-3 min-w-0 ${isUser ? 'flex-row-reverse' : ''}`}
            data-testid={`chat-message-${message.role}`}
        >
            {/* Avatar */}
            <div
                className={`flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${isUser
                    ? 'bg-primary text-primary-foreground'
                    : isTool
                        ? 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300'
                        : 'bg-muted text-muted-foreground'
                    }`}
            >
                {isUser ? (
                    <User className="h-4 w-4" />
                ) : isTool ? (
                    <Wrench className="h-4 w-4" />
                ) : (
                    <Bot className="h-4 w-4" />
                )}
            </div>

            {/* Bubble */}
            <div
                className={`relative group rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5 min-w-0 ${isUser
                    ? 'max-w-[90%] sm:max-w-[75%] bg-primary text-primary-foreground rounded-br-md'
                    : isTool
                        ? 'max-w-[95%] bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-bl-md'
                        : 'max-w-[95%] bg-muted rounded-bl-md'
                    }`}
            >
                {/* Copy button */}
                {message.content && (
                    <button
                        onClick={handleCopy}
                        className={cn(
                            "absolute top-1.5 right-1.5 p-1 rounded-md transition-all",
                            "opacity-0 group-hover:opacity-100",
                            copied
                                ? "text-green-500 bg-green-500/10"
                                : isUser
                                    ? "text-primary-foreground/60 hover:text-primary-foreground hover:bg-primary-foreground/10"
                                    : "text-muted-foreground/60 hover:text-foreground hover:bg-muted-foreground/10"
                        )}
                        title="Copy raw content"
                    >
                        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </button>
                )}

                {isTool && message.toolName && (
                    <div className="text-xs font-semibold mb-1 opacity-70">
                        🔧 {message.toolName}
                    </div>
                )}

                {/* Inline image thumbnails */}
                {message.images && message.images.length > 0 && (
                    <div className="flex gap-1.5 mb-2 flex-wrap">
                        {message.images.map(img => (
                            <img
                                key={img.id}
                                src={img.url}
                                alt={img.name}
                                className={`rounded-lg object-cover border ${isUser ? 'border-primary-foreground/20' : 'border-border'}`}
                                style={{ width: message.images!.length === 1 ? 200 : 80, height: message.images!.length === 1 ? 200 : 80 }}
                            />
                        ))}
                    </div>
                )}

                <div className={`text-sm break-words min-w-0 ${isUser ? 'whitespace-pre-wrap' : ''}`}>
                    {message.content ? (
                        isUser
                            ? <span className="whitespace-pre-wrap">{linkifyContent(message.content)}</span>
                            : <MarkdownRenderer content={unescapeMarkdown(message.content)} className="prose-sm [&>*:first-child]:mt-0 [&>*:last-child]:mb-0" />
                    ) : (
                        <span className="inline-flex items-center gap-2 text-muted-foreground">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Thinking...
                            {onCancel && (
                                <button
                                    onClick={onCancel}
                                    className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded hover:bg-destructive/10 hover:text-destructive transition-colors"
                                    title="Cancel"
                                >
                                    <StopCircle className="h-3 w-3" /> Stop
                                </button>
                            )}
                        </span>
                    )}
                </div>
                {message.isStreaming && message.content && (
                    <div className="flex items-center gap-1">
                        <span className="inline-block w-2 h-4 bg-current opacity-60 animate-pulse ml-0.5 align-text-bottom" />
                        {onCancel && (
                            <button
                                onClick={onCancel}
                                className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                                title="Cancel"
                            >
                                <StopCircle className="h-3 w-3" /> Stop
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MessageBubble;
