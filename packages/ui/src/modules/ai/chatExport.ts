/**
 * Chat export utilities — JSON file download & Markdown clipboard copy
 */

import { toast } from 'sonner';
import type { ChatMessage } from './types';
import type { LogEntry } from '@/contexts/LogContext';

export function exportChatAsJson(
    messages: ChatMessage[],
    chatLogs: LogEntry[],
    provider: string,
    model: string,
    systemPrompt: string,
) {
    const exportData = {
        exported_at: new Date().toISOString(),
        model: `${provider}/${model}`,
        system_prompt: systemPrompt,
        messages: messages.map(m => ({
            role: m.role,
            content: m.content,
            timestamp: m.timestamp,
            ...(m.images?.length ? { images: m.images.map(img => img.url) } : {}),
            ...(m.toolName ? { tool: m.toolName } : {}),
        })),
        logs: chatLogs.map(l => ({
            level: l.level,
            message: l.message,
            timestamp: l.timestamp.toISOString(),
        })),
    };
    const json = JSON.stringify(exportData, null, 2);

    // Copy to clipboard
    navigator.clipboard.writeText(json).catch(() => { });

    // Download file
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-${new Date().toISOString().slice(0, 16).replace(/:/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Chat exported as JSON (also copied to clipboard)');
}

export function exportChatAsMarkdown(
    messages: ChatMessage[],
    provider: string,
    model: string,
    systemPrompt: string,
) {
    const lines: string[] = [
        `# Chat Export`,
        `> ${provider}/${model} — ${new Date().toLocaleString()}`,
        '',
    ];
    if (systemPrompt) {
        lines.push('## System Prompt', '', systemPrompt, '');
    }
    lines.push('---', '');
    for (const m of messages) {
        const ts = new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const role = m.role === 'user' ? '🧑 User' : m.role === 'tool' ? `🔧 ${m.toolName || 'Tool'}` : '🤖 Assistant';
        lines.push(`### ${role}  \`${ts}\``, '');
        if (m.content) lines.push(m.content, '');
        if (m.images?.length) {
            for (const img of m.images) {
                lines.push(`![${img.name}](${img.url})`, '');
            }
        }
        lines.push('---', '');
    }
    navigator.clipboard.writeText(lines.join('\n')).then(() => {
        toast.success('Chat copied as Markdown');
    });
}
