import React from 'react';
import { ArrowUp } from 'lucide-react';
import type { Action } from '@/actions/types';
import { VfsContextMenuRow } from '@/modules/storage/VfsContextMenu';
import type { INode } from './types';
import { FOCUS_BG, FOCUS_BORDER, SELECTED_BG, SELECTED_BORDER } from './types';
import { getMimeCategory, CATEGORY_STYLE, formatSize, formatDate } from './helpers';
import { NodeIcon } from './ThumbPreview';

// ── Props ────────────────────────────────────────────────────────

interface FileListViewProps {
    listRef: React.RefObject<HTMLDivElement>;
    sorted: INode[];
    canGoUp: boolean;
    goUp: () => void;
    focusIdx: number;
    setFocusIdx: (idx: number) => void;
    selected: INode[];
    onItemClick: (idx: number, e?: React.MouseEvent) => void;
    onItemDoubleClick: (idx: number) => void;
    fontSize: number;
    mode: string;
    /** Current type-ahead search buffer for visual highlight */
    searchBuffer?: string;
    isSearchMode?: boolean;
    /** Radix context menu: same VFS actions as ribbon; requires both. */
    vfsContextMenuActions?: Action[];
    onVfsContextMenuOpen?: (idx: number) => void;
}

// ── Component ────────────────────────────────────────────────────

const FileListView: React.FC<FileListViewProps> = ({
    listRef, sorted, canGoUp, goUp, focusIdx, setFocusIdx,
    selected, onItemClick, onItemDoubleClick, fontSize, mode, searchBuffer, isSearchMode,
    vfsContextMenuActions, onVfsContextMenuOpen,
}) => {
    const menuOn = Boolean(vfsContextMenuActions?.length && onVfsContextMenuOpen);
    const wrapRow = (stableKey: string, idx: number, row: React.ReactElement) =>
        menuOn ? (
            <VfsContextMenuRow
                key={stableKey}
                actions={vfsContextMenuActions!}
                onBeforeOpen={() => onVfsContextMenuOpen!(idx)}
            >
                {row}
            </VfsContextMenuRow>
        ) : (
            row
        );

    return (
    <div ref={listRef as any} data-testid="file-list-view" style={{ overflowY: 'auto', flex: 1, padding: 2 }}>
        {canGoUp && !isSearchMode && wrapRow('fb-up', 0, (
            <div data-fb-idx={0} onClick={() => setFocusIdx(0)} onDoubleClick={goUp}
                data-testid="file-list-node-up"
                className="fb-row" style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '5px 10px',
                    cursor: 'pointer', fontSize, borderBottom: '1px solid rgba(255,255,255,0.06)',
                    background: focusIdx === 0 ? FOCUS_BG : 'transparent',
                    borderLeftWidth: 2, borderLeftColor: 'transparent',
                    borderLeftStyle: 'solid',
                    outline: focusIdx === 0 ? `2px solid ${FOCUS_BORDER}` : 'none',
                    outlineOffset: '-2px',
                }}>
                <ArrowUp size={14} style={{ color: CATEGORY_STYLE.dir.color }} />
                <span style={{ fontWeight: 500 }}>..</span>
            </div>
        ))}
        {sorted.map((node, i) => {
            // Note: in search mode, canGoUp is usually false, or we explicitly don't shift index by 1 since there is no ".." node rendered
            const idx = ((canGoUp && !isSearchMode) ? i + 1 : i);
            const isDir = getMimeCategory(node) === 'dir';
            const isFocused = focusIdx === idx;
            const isSelected = selected.some(sel => sel.path === node.path);
            const { _uploading, _progress, _error } = node as any;

            return wrapRow(node.path || node.name, idx, (
                <div data-fb-idx={idx}
                    data-testid="file-list-node"
                    data-node-id={node.path || node.name}
                    onClick={(e) => onItemClick(idx, e)}
                    onDoubleClick={() => !_uploading && onItemDoubleClick(idx)}
                    className="fb-row" style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: isSearchMode ? '8px 10px' : '5px 10px',
                        cursor: _uploading ? 'default' : 'pointer', fontSize,
                        borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)', borderBottomStyle: 'solid',
                        background: isSelected ? SELECTED_BG : isFocused ? FOCUS_BG : 'transparent',
                        borderLeftWidth: 2, borderLeftColor: isSelected ? SELECTED_BORDER : 'transparent',
                        borderLeftStyle: isSelected ? 'outset' : 'solid',
                        outline: isFocused ? `2px solid ${FOCUS_BORDER}` : 'none',
                        outlineOffset: '-2px',
                        opacity: _uploading ? 0.7 : 1,
                        position: 'relative'
                    }}>
                    <NodeIcon node={node} />
                    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: isSearchMode ? 2 : 0 }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {(() => {
                                if (!isFocused || !searchBuffer) return node.name;
                                const lower = node.name.toLowerCase();
                                const pos = lower.startsWith(searchBuffer) ? 0 : lower.indexOf(searchBuffer);
                                if (pos < 0) return node.name;
                                const isDark = document.documentElement.classList.contains('dark');
                                const hlStyle = {
                                    background: isDark ? 'rgba(14,165,233,0.3)' : 'rgba(245,158,11,0.25)',
                                    color: isDark ? '#bae6fd' : '#92400e',
                                    borderBottom: isDark ? '1px solid #38bdf8' : '1px solid #f59e0b',
                                };
                                return (
                                    <>
                                        {pos > 0 && node.name.slice(0, pos)}
                                        <span style={hlStyle}>
                                            {node.name.slice(pos, pos + searchBuffer.length)}
                                        </span>
                                        {node.name.slice(pos + searchBuffer.length)}
                                    </>
                                );
                            })()}
                        </span>
                        {isSearchMode && (
                            <span style={{ fontSize: 10, color: 'var(--muted-foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {node.parent || '/'}
                            </span>
                        )}
                        {_uploading && (
                            <div style={{
                                width: '100%', height: 4, background: 'rgba(0,0,0,0.2)',
                                borderRadius: 2, overflow: 'hidden', marginTop: 2
                            }}>
                                <div style={{
                                    height: '100%', width: `${_progress || 0}%`,
                                    background: 'var(--primary, #3b82f6)', transition: 'width 0.2s linear'
                                }} />
                            </div>
                        )}
                        {_error && (
                            <span style={{ fontSize: 10, color: '#ef4444', marginTop: 2 }}>{_error}</span>
                        )}
                    </div>
                    {node.size !== undefined && (
                        <span style={{ color: _error ? '#ef4444' : 'var(--muted-foreground, #64748b)', fontSize: 10, flexShrink: 0 }}>
                            {_error ? '✕' : _uploading ? `${Math.round(_progress || 0)}%` : formatSize(node.size)}
                        </span>
                    )}
                    {mode === 'advanced' && node.mtime && !_uploading && (
                        <span style={{ color: 'var(--muted-foreground, #64748b)', fontSize: 10, flexShrink: 0, width: 120, textAlign: 'right' }}>
                            {formatDate(node.mtime)}
                        </span>
                    )}
                </div>
            ));
        })}
    </div>
    );
};

export default FileListView;
