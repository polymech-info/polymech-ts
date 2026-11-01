/**
 * Chat session storage — save/load/list/delete chat sessions in localStorage
 */

import type { ChatMessage } from './types';

export interface ChatSession {
    id: string;
    title: string;
    createdAt: number;
    updatedAt: number;
    messages: ChatMessage[];
}

const SESSIONS_INDEX_KEY = 'chat-sessions-index';
const SESSION_PREFIX = 'chat-session-';
const MAX_SESSIONS = 50;

/** Get the list of session metadata (no messages) sorted by most recent */
export function listSessions(): Omit<ChatSession, 'messages'>[] {
    try {
        const raw = localStorage.getItem(SESSIONS_INDEX_KEY);
        if (!raw) return [];
        const index: Omit<ChatSession, 'messages'>[] = JSON.parse(raw);
        return index.sort((a, b) => b.updatedAt - a.updatedAt);
    } catch { return []; }
}

/** Load a full session by ID */
export function loadSession(id: string): ChatSession | null {
    try {
        const raw = localStorage.getItem(SESSION_PREFIX + id);
        return raw ? JSON.parse(raw) : null;
    } catch { return null; }
}

/** Save a session (creates or updates) */
export function saveSession(session: ChatSession): void {
    try {
        // Save full session data
        localStorage.setItem(SESSION_PREFIX + session.id, JSON.stringify(session));

        // Update index
        const index = listSessions();
        const existing = index.findIndex(s => s.id === session.id);
        const meta = { id: session.id, title: session.title, createdAt: session.createdAt, updatedAt: session.updatedAt };
        if (existing >= 0) {
            index[existing] = meta;
        } else {
            index.unshift(meta);
        }

        // Trim old sessions
        while (index.length > MAX_SESSIONS) {
            const removed = index.pop();
            if (removed) localStorage.removeItem(SESSION_PREFIX + removed.id);
        }

        localStorage.setItem(SESSIONS_INDEX_KEY, JSON.stringify(index));
    } catch { }
}

/** Delete a session */
export function deleteSession(id: string): void {
    try {
        localStorage.removeItem(SESSION_PREFIX + id);
        const index = listSessions().filter(s => s.id !== id);
        localStorage.setItem(SESSIONS_INDEX_KEY, JSON.stringify(index));
    } catch { }
}

/** Auto-generate a title from the first user message */
export function generateSessionTitle(messages: ChatMessage[]): string {
    const firstUser = messages.find(m => m.role === 'user');
    if (!firstUser?.content) return 'New Chat';
    const text = firstUser.content.slice(0, 60);
    return text.length < firstUser.content.length ? text + '…' : text;
}
