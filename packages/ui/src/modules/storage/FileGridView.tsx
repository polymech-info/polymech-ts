import React from 'react';
import { ArrowUp } from 'lucide-react';
import type { Action } from '@/actions/types';
import { VfsContextMenuRow } from '@/modules/storage/VfsContextMenu';
import type { INode } from './types';
import { FOCUS_BG, FOCUS_BORDER, SELECTED_BG, SELECTED_BORDER } from './types';
import { getMimeCategory, CATEGORY_STYLE } from './helpers';
import { NodeIcon, ThumbPreview } from './ThumbPreview';

// ── Props ────────────────────────────────────────────────────────

interface FileGridViewProps {
    listRef: React.RefObject<HTMLDivElement>;
    sorted: INode[];
    canGoUp: boolean;
    goUp: () => void;
    focusIdx: number;
    setFocusIdx: (idx: number) => void;
    selected: INode[];
    onItemClick: (idx: number, e?: React.MouseEvent) => void;
    onItemDoubleClick: (idx: number) => void;
    thumbSize: number;
    mount: string;
    tokenParam: string;
    fontSize: number;
    isSearchMode?: boolean;
    vfsContextMenuActions?: Action[];
    onVfsContextMenuOpen?: (idx: number) => void;
}

// ── Component ────────────────────────────────────────────────────

const FileGridView: React.FC<FileGridViewProps> = ({
    listRef, sorted, canGoUp, goUp, focusIdx, setFocusIdx,
    selected, onItemClick, onItemDoubleClick, thumbSize, mount, tokenParam, fontSize, isSearchMode,
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
            React.cloneElement(row, { key: stableKey })
        );

    return (
        <div ref={listRef as any} data-testid="file-grid-view" style={{
            overflowY: 'auto', flex: 1, minHeight: 0, display: 'grid',
            gridTemplateColumns: `repeat(auto-fill, minmax(${thumbSize}px, 1fr))`,
            gridAutoRows: 'max-content',
            gap: 12, padding: 16, alignContent: 'start',
        }}>
            {canGoUp && !isSearchMode && wrapRow('fb-up', 0, (
                <div data-fb-idx={0} onClick={() => setFocusIdx(0)} onDoubleClick={goUp} className="fb-thumb"
                    data-testid="file-grid-node-up"
                    style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        padding: 2, borderRadius: 2, cursor: 'pointer', gap: 2, aspectRatio: '1',
                        borderWidth: 1, borderColor: 'transparent',
                        borderStyle: 'solid',
                        background: focusIdx === 0 ? FOCUS_BG : 'transparent',
                        outline: focusIdx === 0 ? `2px solid ${FOCUS_BORDER}` : 'none',
                        outlineOffset: '2px',
                    }}>
                    <ArrowUp size={24} style={{ color: CATEGORY_STYLE.dir.color }} />
                    <span style={{ fontSize: fontSize }}>..</span>
                </div>
            ))}
            {sorted.map((node, i) => {
                const idx = ((canGoUp && !isSearchMode) ? i + 1 : i);
                const isDir = getMimeCategory(node) === 'dir';
                const isFocused = focusIdx === idx;
                const isSelected = selected.some(sel => sel.path === node.path);
                const { _uploading, _progress, _error } = node as any;

                return wrapRow(node.path || node.name, idx, (
                    <div
                        data-fb-idx={idx}
                        data-testid="file-grid-node"
                        data-node-id={node.path || node.name}
                        onClick={(e) => onItemClick(idx, e)}
                        onDoubleClick={() => !_uploading && onItemDoubleClick(idx)}
                        className="fb-thumb" style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            padding: 6, borderRadius: 6, cursor: _uploading ? 'default' : 'pointer', gap: 6, overflow: 'hidden',
                            background: isSelected ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
                            opacity: (_uploading || _error) ? 0.7 : 1,
                        }}>
                        <div style={{
                            width: '100%', aspectRatio: '1/1',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            borderRadius: 6, overflow: 'hidden',
                            borderWidth: isSelected ? 0 : 1,
                            borderColor: isSelected ? SELECTED_BORDER : 'transparent',
                            borderStyle: 'solid',
                            outline: isFocused ? `2px solid ${FOCUS_BORDER}` : 'none',
                            outlineOffset: '2px',
                            position: 'relative'
                        }}>
                            {isDir ? <NodeIcon node={node} size={Math.max(24, Math.floor(thumbSize * 0.5))} /> : <ThumbPreview node={node} mount={mount} tokenParam={tokenParam} thumbSize={thumbSize} />}

                            {_uploading && (
                                <div style={{
                                    position: 'absolute', bottom: 0, left: 0, right: 0, height: 6,
                                    background: 'rgba(0,0,0,0.5)', overflow: 'hidden'
                                }}>
                                    <div style={{
                                        height: '100%', width: `${_progress || 0}%`,
                                        background: 'var(--primary, #3b82f6)', transition: 'width 0.2s linear'
                                    }} />
                                </div>
                            )}
                            {_error && (
                                <div style={{
                                    position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: 'rgba(239, 68, 68, 0.12)', borderRadius: 6,
                                }}>
                                    <span style={{ fontSize: 11, color: '#ef4444', fontWeight: 600, textAlign: 'center', padding: 4 }}>{_error}</span>
                                </div>
                            )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', alignItems: 'center', gap: 2 }}>
                            <span style={{
                                fontSize: fontSize, textAlign: 'center', width: '100%',
                                overflow: 'hidden', textOverflow: 'ellipsis',
                                display: '-webkit-box', WebkitLineClamp: isSearchMode ? 1 : 2, WebkitBoxOrient: 'vertical',
                                wordBreak: 'break-word', lineHeight: 1.3,
                                minHeight: isSearchMode ? fontSize * 1.3 : fontSize * 1.3 * 2,
                            }}>
                                {node.name}
                            </span>
                            {isSearchMode && (
                                <span style={{
                                    fontSize: Math.max(10, fontSize * 0.8), color: 'var(--muted-foreground)', textAlign: 'center', width: '100%',
                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                                }}>
                                    {node.parent || '/'}
                                </span>
                            )}
                        </div>
                    </div>
                ));
            })}
        </div>
    );
};

export default FileGridView;
