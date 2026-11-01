import type { FileBrowserWidgetProps } from '@polymech/shared';
import React from 'react';

// ── Data types ───────────────────────────────────────────────────

export interface INode {
    name: string;
    path: string;
    size: number;
    mtime?: number;
    mime?: string;
    parent: string;
    type: string;
}

export type SortKey = 'name' | 'ext' | 'date' | 'type';
export type MimeCategory = 'dir' | 'image' | 'video' | 'audio' | 'code' | 'document' | 'archive' | 'spreadsheet' | 'presentation' | 'other';

// ── Extended props (adds controlled-mode callbacks) ─────────────

export interface FileBrowserWidgetExtendedProps extends Omit<FileBrowserWidgetProps, 'path' | 'variables' | 'viewMode' | 'allowPreview'> {
    variables?: any;
    path?: string;
    onPathChange?: (path: string) => void;
    onMountChange?: (mount: string) => void;
    onSelect?: (path: string | null) => void;
    onSelectNode?: (node: INode | null) => void;
    onSelectNodes?: (nodes: INode[]) => void;
    allowPreview?: boolean;
    viewMode?: 'list' | 'thumbs' | 'tree';
    onSettingsChange?: (updates: Record<string, any>) => void;
    onSearchQueryChange?: (newQuery: string) => void;
    index?: boolean;
}

// ── Toolbar style constants ─────────────────────────────────────

export const TB_BTN: React.CSSProperties = {
    background: 'none', border: 'none', cursor: 'pointer',
    padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'var(--muted-foreground, #94a3b8)', borderRadius: 4,
};
export const TB_BTN_ACTIVE: React.CSSProperties = { ...TB_BTN, color: 'var(--foreground, #e2e8f0)' };
export const TB_SEP: React.CSSProperties = { width: 1, height: 18, background: 'var(--border, #334155)', flexShrink: 0 };

// ── Selection style constants ───────────────────────────────────

export const FOCUS_BG = 'var(--accent, #334155)';
export const FOCUS_BORDER = '#0ea5e9'; // Bright sky blue outline for high-contrast keyboard navigation
export const SELECTED_BG = 'rgba(59, 130, 246, 0.15)';
export const SELECTED_BORDER = 'var(--ring, #3b82f6)';
