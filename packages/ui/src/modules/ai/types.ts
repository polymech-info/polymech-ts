/**
 * Chat Playground — shared types & helpers
 */

import { serverUrl } from "@/lib/db";

export interface ImageAttachment {
    id: string;
    url: string;       // data URL for local files, or remote URL from picker
    name: string;
    isLocal?: boolean;  // true = dropped/pasted file (data URL)
}

/** A VFS file attached as context for the AI conversation */
export interface FileContext {
    path: string;       // full VFS path (e.g. "notes/readme.md")
    mount: string;      // VFS mount point (e.g. "home")
    name: string;       // filename only (e.g. "readme.md")
    content: string;    // file text content
}

export interface ChatMessage {
    id: string;
    role: 'system' | 'user' | 'assistant' | 'tool';
    content: string;
    timestamp: number;
    toolName?: string;
    isStreaming?: boolean;
    images?: ImageAttachment[];
    /** Compact summary of tool results from this turn, sent as context in follow-up messages */
    toolContext?: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────

export const fileToDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });

/** Convert a remote image URL to a resized proxy URL via the production server.
 *  Local images (data URLs, blobs) pass through unchanged. */
const RENDER_API_BASE = serverUrl;

export const getResizedImageUrl = (img: ImageAttachment, maxWidth = 1000): string => {
    if (img.isLocal || img.url.startsWith('data:') || img.url.startsWith('blob:')) {
        return img.url;
    }
    if (RENDER_API_BASE && img.url.startsWith('http')) {
        return `${RENDER_API_BASE}/api/images/render?url=${encodeURIComponent(img.url)}&width=${maxWidth}&format=webp`;
    }
    return img.url;
};
