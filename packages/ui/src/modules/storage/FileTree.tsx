import React, { useMemo, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ChevronRight, Folder, FolderOpen, File, ArrowUp, Loader2 } from "lucide-react";
import type { Action } from "@/actions/types";
import { INode } from "@/modules/storage/types";
import { getMimeCategory } from "@/modules/storage/helpers";
import { cn } from "@/lib/utils";
import { VfsContextMenuRow } from "@/modules/storage/VfsContextMenu";

export interface FileTreeProps {
    data: INode[];
    onSelect?: (node: INode) => void;
    /** Fires whenever multi-select changes — passes all currently selected nodes */
    onSelectionChange?: (nodes: INode[]) => void;
    onActivate?: (node: INode) => void;
    onGoUp?: () => void;
    canGoUp?: boolean;
    selectedId?: string;
    className?: string;
    /** Async loader for folder children. If provided, folders become expandable inline. */
    fetchChildren?: (node: INode) => Promise<INode[]>;
    fontSize?: number;
    /** Same VFS context menu as list/grid; tree applies Explorer-style selection in-tree. */
    vfsContextMenuActions?: Action[];
}

type TreeRow = {
    id: string;
    name: string;
    node: INode;
    isDir: boolean;
    isNavUp: boolean;
    depth: number;
    parentId: string | null;
    expanded: boolean;
    loading: boolean;
};

interface ExpandState {
    expanded: boolean;
    children: INode[];
    loading: boolean;
}

function sortDirsFirst(nodes: INode[]): INode[] {
    return [...nodes].sort((a, b) => {
        const aDir = getMimeCategory(a) === 'dir' ? 0 : 1;
        const bDir = getMimeCategory(b) === 'dir' ? 0 : 1;
        if (aDir !== bDir) return aDir - bDir;
        return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    });
}

function buildRows(
    nodes: INode[],
    canGoUp: boolean,
    expandMap: Record<string, ExpandState>,
    depth: number = 0,
    parentId: string | null = null
): TreeRow[] {
    const rows: TreeRow[] = [];
    if (depth === 0 && canGoUp) {
        rows.push({
            id: '__nav_up__',
            name: '..',
            node: { name: '..', path: '..', type: 'dir', mime: 'inode/directory' } as INode,
            isDir: true,
            isNavUp: true,
            depth: 0,
            parentId: null,
            expanded: false,
            loading: false,
        });
    }
    for (const n of nodes) {
        const isDir = getMimeCategory(n) === 'dir';
        const state = expandMap[n.path];
        const expanded = state?.expanded ?? false;
        const loading = state?.loading ?? false;
        rows.push({
            id: n.path,
            name: n.name,
            node: n,
            isDir,
            isNavUp: false,
            depth,
            parentId,
            expanded,
            loading,
        });
        if (isDir && expanded && state?.children?.length) {
            const childRows = buildRows(
                sortDirsFirst(state.children),
                false,
                expandMap,
                depth + 1,
                n.path
            );
            rows.push(...childRows);
        }
    }
    return rows;
}

/** Search rows: try startsWith first, fall back to includes */
function findMatchIdx(rows: TreeRow[], str: string, startFrom: number, direction: 1 | -1 = 1): number {
    const count = rows.length;
    // Pass 1: startsWith
    for (let i = 0; i < count; i++) {
        const idx = ((startFrom + i * direction) % count + count) % count;
        if (rows[idx].name.toLowerCase().startsWith(str)) return idx;
    }
    // Pass 2: includes
    for (let i = 0; i < count; i++) {
        const idx = ((startFrom + i * direction) % count + count) % count;
        if (rows[idx].name.toLowerCase().includes(str)) return idx;
    }
    return -1;
}

export const FileTree = React.forwardRef<HTMLDivElement, FileTreeProps>(
    ({ data, onSelect, onSelectionChange, onActivate, onGoUp, canGoUp = false, selectedId, className, fetchChildren, fontSize = 14, vfsContextMenuActions }, forwardedRef) => {
        const [expandMap, setExpandMap] = useState<Record<string, ExpandState>>({});
        const rows = useMemo(() => buildRows(data, canGoUp, expandMap), [data, canGoUp, expandMap]);
        const [focusIdx, setFocusIdx] = useState(0);
        const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
        const anchorIdx = useRef<number>(0); // anchor for shift-click range selection
        const containerRef = useRef<HTMLDivElement>(null);
        const rowRefs = useRef<(HTMLDivElement | null)[]>([]);

        // Type-ahead search
        const searchBuf = useRef('');
        const searchTimer = useRef<any>(null);
        const [searchDisplay, setSearchDisplay] = useState(''); // mirrors searchBuf for rendering

        // Merge forwarded ref
        const setRef = useCallback((el: HTMLDivElement | null) => {
            (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
            if (typeof forwardedRef === 'function') forwardedRef(el);
            else if (forwardedRef) (forwardedRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
        }, [forwardedRef]);

        // Reset expand state when root data changes
        useEffect(() => {
            setExpandMap({});
            setSelectedIds(new Set());
        }, [data]);

        // Sync selectedId prop from parent
        useEffect(() => {
            if (selectedId) {
                // If it's already selected, do nothing
                setSelectedIds(prev => {
                    if (prev.size === 1 && prev.has(selectedId)) return prev;
                    return new Set([selectedId]);
                });
                const idx = rows.findIndex(r => r.id === selectedId);
                if (idx >= 0) {
                    setFocusIdx(idx);
                }
            } else if (selectedId === undefined && data.length === 0) {
                setSelectedIds(new Set());
            }
        }, [selectedId, rows, data.length]);

        // Auto-focus first real item when root data changes
        const prevDataRef = useRef(data);
        useLayoutEffect(() => {
            if (data === prevDataRef.current && rows.length > 0) {
                // If data hasn't changed but rows has, this is an expand/collapse operation. Don't reset.
                return;
            }
            prevDataRef.current = data;

            if (rows.length === 0) return;

            // Give priority to selectedId provided by parent (e.g. return focus matching target)
            if (selectedId) {
                const existingIdx = rows.findIndex(r => r.id === selectedId);
                if (existingIdx >= 0) {
                    containerRef.current?.focus({ preventScroll: true });
                    return;
                }
            }

            const startIdx = canGoUp ? 1 : 0;
            const idx = startIdx < rows.length ? startIdx : 0;
            setFocusIdx(idx);
            anchorIdx.current = idx;
            containerRef.current?.focus({ preventScroll: true });
        }, [data, canGoUp, rows, selectedId]);

        // Scroll focused item into view
        useEffect(() => {
            rowRefs.current[focusIdx]?.scrollIntoView({ block: 'nearest' });
        }, [focusIdx]);

        // Stable ref for onSelectionChange to avoid infinite loop
        // (inline arrow in parent JSX creates new ref every render)
        const onSelectionChangeRef = useRef(onSelectionChange);
        onSelectionChangeRef.current = onSelectionChange;
        const rowsRef = useRef(rows);
        rowsRef.current = rows;

        // Notify parent when selection changes (only on selectedIds change, NOT rows)
        useEffect(() => {
            if (!onSelectionChangeRef.current) return;
            const currentRows = rowsRef.current;
            const selectedNodes = currentRows.filter(r => selectedIds.has(r.id) && !r.isNavUp).map(r => r.node);
            onSelectionChangeRef.current(selectedNodes);
        }, [selectedIds]);

        // ── Expand / Collapse ────────────────────────────────────────

        const toggleExpand = useCallback(async (row: TreeRow) => {
            if (!row.isDir || row.isNavUp || !fetchChildren) return;
            const path = row.node.path;
            const current = expandMap[path];

            if (current?.expanded) {
                setExpandMap(prev => ({
                    ...prev,
                    [path]: { ...prev[path], expanded: false },
                }));
            } else if (current?.children?.length) {
                setExpandMap(prev => ({
                    ...prev,
                    [path]: { ...prev[path], expanded: true },
                }));
            } else {
                setExpandMap(prev => ({
                    ...prev,
                    [path]: { expanded: true, children: [], loading: true },
                }));
                try {
                    const children = await fetchChildren(row.node);
                    setExpandMap(prev => ({
                        ...prev,
                        [path]: { expanded: true, children, loading: false },
                    }));
                } catch {
                    setExpandMap(prev => ({
                        ...prev,
                        [path]: { expanded: false, children: [], loading: false },
                    }));
                }
            }
        }, [expandMap, fetchChildren]);

        /** Batch expand/collapse all selected folders */
        const toggleExpandSelected = useCallback(async () => {
            if (!fetchChildren || selectedIds.size === 0) return;
            const selectedDirs = rows.filter(r => selectedIds.has(r.id) && r.isDir && !r.isNavUp);
            if (selectedDirs.length === 0) return;

            // If ANY are collapsed, expand all. If ALL expanded, collapse all.
            const anyCollapsed = selectedDirs.some(r => !r.expanded);

            if (!anyCollapsed) {
                // Collapse all
                setExpandMap(prev => {
                    const next = { ...prev };
                    for (const r of selectedDirs) {
                        next[r.node.path] = { ...next[r.node.path], expanded: false };
                    }
                    return next;
                });
            } else {
                // Expand all (fetch as needed)
                for (const r of selectedDirs) {
                    if (!r.expanded) {
                        await toggleExpand(r);
                    }
                }
            }
        }, [fetchChildren, selectedIds, rows, toggleExpand]);

        const collapseNode = useCallback((row: TreeRow) => {
            if (!row.isDir || row.isNavUp) return;
            setExpandMap(prev => ({
                ...prev,
                [row.node.path]: { ...prev[row.node.path], expanded: false },
            }));
        }, []);

        // Activate handler (enter / double-click)
        const activate = useCallback((row: TreeRow) => {
            if (row.isNavUp) {
                onGoUp?.();
            } else {
                onActivate?.(row.node);
            }
        }, [onActivate, onGoUp]);

        // ── Selection helpers ────────────────────────────────────────

        /** Simple select — replaces selection with single item */
        const selectRow = useCallback((idx: number) => {
            setFocusIdx(idx);
            anchorIdx.current = idx;
            const row = rows[idx];
            if (!row || row.isNavUp) {
                setSelectedIds(new Set());
                return;
            }
            setSelectedIds(new Set([row.id]));
            onSelect?.(row.node);
        }, [rows, onSelect]);

        /** Ctrl+click — toggle item in/out of selection */
        const toggleSelectRow = useCallback((idx: number) => {
            setFocusIdx(idx);
            anchorIdx.current = idx;
            const row = rows[idx];
            if (!row || row.isNavUp) return;
            setSelectedIds(prev => {
                const next = new Set(prev);
                if (next.has(row.id)) next.delete(row.id);
                else next.add(row.id);
                return next;
            });
        }, [rows]);

        /** Shift+click — range select from anchor to idx */
        const rangeSelectTo = useCallback((idx: number) => {
            setFocusIdx(idx);
            const start = Math.min(anchorIdx.current, idx);
            const end = Math.max(anchorIdx.current, idx);
            const ids = new Set<string>();
            for (let i = start; i <= end; i++) {
                const r = rows[i];
                if (r && !r.isNavUp) ids.add(r.id);
            }
            setSelectedIds(ids);
        }, [rows]);

        // Click handler
        const handleClick = useCallback((idx: number, e: React.MouseEvent) => {
            if (e.ctrlKey || e.metaKey) {
                toggleSelectRow(idx);
            } else if (e.shiftKey) {
                rangeSelectTo(idx);
            } else {
                selectRow(idx);
            }
            containerRef.current?.focus({ preventScroll: true });
        }, [selectRow, toggleSelectRow, rangeSelectTo]);

        const menuOn = Boolean(vfsContextMenuActions?.length);

        /** Explorer-style: focus row; if target is not in the current selection, select only that row. */
        const prepareContextMenuRow = useCallback((idx: number) => {
            const row = rows[idx];
            setFocusIdx(idx);
            anchorIdx.current = idx;
            setSelectedIds((prev) => {
                if (!row || row.isNavUp) return new Set();
                if (prev.has(row.id)) return prev;
                return new Set([row.id]);
            });
        }, [rows]);

        const wrapTreeRow = useCallback((stableKey: string, idx: number, rowEl: React.ReactElement) =>
            menuOn ? (
                <VfsContextMenuRow
                    key={stableKey}
                    actions={vfsContextMenuActions!}
                    onBeforeOpen={() => prepareContextMenuRow(idx)}
                >
                    {rowEl}
                </VfsContextMenuRow>
            ) : (
                React.cloneElement(rowEl, { key: stableKey })
            ), [menuOn, vfsContextMenuActions, prepareContextMenuRow]);

        // Keyboard handler
        const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
            if (e.altKey) return;

            const count = rows.length;
            if (count === 0) return;

            switch (e.key) {
                case 'ArrowDown': {
                    e.preventDefault();
                    if (searchBuf.current) {
                        // Cycle to next match
                        const found = findMatchIdx(rows, searchBuf.current, focusIdx + 1, 1);
                        if (found >= 0) selectRow(found);
                    } else {
                        const next = focusIdx < count - 1 ? focusIdx + 1 : 0;
                        if (e.shiftKey) rangeSelectTo(next);
                        else selectRow(next);
                    }
                    break;
                }
                case 'ArrowUp': {
                    e.preventDefault();
                    if (searchBuf.current) {
                        // Cycle to previous match
                        const found = findMatchIdx(rows, searchBuf.current, focusIdx - 1 + count, -1);
                        if (found >= 0) selectRow(found);
                    } else {
                        const prev = focusIdx > 0 ? focusIdx - 1 : count - 1;
                        if (e.shiftKey) rangeSelectTo(prev);
                        else selectRow(prev);
                    }
                    break;
                }
                case 'ArrowRight': {
                    e.preventDefault();
                    // Multi-select: expand all selected collapsed dirs
                    if (fetchChildren && selectedIds.size > 1) {
                        const selectedDirs = rows.filter(r => selectedIds.has(r.id) && r.isDir && !r.isNavUp && !r.expanded);
                        if (selectedDirs.length > 0) {
                            for (const r of selectedDirs) toggleExpand(r);
                            break;
                        }
                    }
                    // Single-item behavior
                    const rowR = rows[focusIdx];
                    if (!rowR) break;
                    if (rowR.isDir && !rowR.isNavUp && fetchChildren) {
                        if (!rowR.expanded) {
                            toggleExpand(rowR);
                        } else {
                            if (focusIdx < count - 1) selectRow(focusIdx + 1);
                        }
                    } else {
                        if (focusIdx < count - 1) selectRow(focusIdx + 1);
                    }
                    break;
                }
                case 'ArrowLeft': {
                    e.preventDefault();
                    // Clean stale IDs (children of collapsed folders no longer in view)
                    const visibleIds = new Set(rows.map(r => r.id));
                    const cleanIds = new Set([...selectedIds].filter(id => visibleIds.has(id)));
                    if (cleanIds.size !== selectedIds.size) setSelectedIds(cleanIds);

                    // Multi-select: collapse all selected expanded dirs
                    if (fetchChildren && cleanIds.size > 1) {
                        const selectedDirs = rows.filter(r => cleanIds.has(r.id) && r.isDir && !r.isNavUp && r.expanded);
                        if (selectedDirs.length > 0) {
                            for (const r of selectedDirs) collapseNode(r);
                            break;
                        }
                    }
                    // Single-item behavior
                    const rowL = rows[focusIdx];
                    if (!rowL) break;
                    if (rowL.isDir && !rowL.isNavUp && rowL.expanded && fetchChildren) {
                        collapseNode(rowL);
                    } else if (rowL.parentId) {
                        const parentIdx = rows.findIndex(r => r.id === rowL.parentId);
                        if (parentIdx >= 0) {
                            const parentRow = rows[parentIdx];
                            if (parentRow) collapseNode(parentRow);
                            selectRow(parentIdx);
                        }
                    } else if (canGoUp) {
                        onGoUp?.();
                    }
                    break;
                }
                case 'Enter': {
                    e.preventDefault();
                    const row = rows[focusIdx];
                    if (row) activate(row);
                    break;
                }
                case 'Backspace': {
                    e.preventDefault();
                    if (searchBuf.current.length > 0) {
                        searchBuf.current = searchBuf.current.slice(0, -1);
                        if (searchBuf.current.length > 0) {
                            const found = findMatchIdx(rows, searchBuf.current, 0, 1);
                            if (found >= 0) selectRow(found);
                        }
                    } else if (canGoUp) {
                        onGoUp?.();
                    }
                    break;
                }
                case 'Home': {
                    e.preventDefault();
                    if (e.shiftKey) rangeSelectTo(0);
                    else selectRow(0);
                    break;
                }
                case 'End': {
                    e.preventDefault();
                    if (e.shiftKey) rangeSelectTo(count - 1);
                    else selectRow(count - 1);
                    break;
                }
                case ' ': {
                    e.preventDefault();
                    if (fetchChildren && selectedIds.size > 0) {
                        // Batch expand/collapse selected dirs
                        const hasSelectedDirs = rows.some(r => selectedIds.has(r.id) && r.isDir && !r.isNavUp);
                        if (hasSelectedDirs) {
                            toggleExpandSelected();
                            break;
                        }
                    }
                    // Fallback: toggle single focused folder or activate file
                    const row = rows[focusIdx];
                    if (row?.isDir && !row.isNavUp && fetchChildren) {
                        toggleExpand(row);
                    } else if (row) {
                        activate(row);
                    }
                    break;
                }
                case 'a': {
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        // Select all
                        const all = new Set<string>();
                        for (const r of rows) {
                            if (!r.isNavUp) all.add(r.id);
                        }
                        setSelectedIds(all);
                    }
                    break;
                }
                case 'Escape': {
                    e.preventDefault();
                    if (searchBuf.current) {
                        searchBuf.current = '';
                        setSearchDisplay('');
                    } else {
                        setSelectedIds(new Set());
                    }
                    break;
                }
                case 'F10': {
                    if (e.shiftKey && menuOn) {
                        e.preventDefault();
                        e.stopPropagation();
                        const idx = focusIdx;
                        prepareContextMenuRow(idx);
                        const el = rowRefs.current[idx] ?? containerRef.current?.querySelector(`[data-fb-idx="${idx}"]`);
                        if (el) {
                            const r = el.getBoundingClientRect();
                            el.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, view: window, button: 2 }));
                        }
                    }
                    break;
                }
                default: {
                    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
                        const char = e.key.toLowerCase();
                        searchBuf.current += char;
                        setSearchDisplay(searchBuf.current);

                        if (searchTimer.current) clearTimeout(searchTimer.current);
                        searchTimer.current = setTimeout(() => { searchBuf.current = ''; setSearchDisplay(''); }, 10000);

                        const str = searchBuf.current;
                        const found = findMatchIdx(rows, str, focusIdx, 1);
                        if (found >= 0) selectRow(found);
                    }
                    break;
                }
            }
        }, [focusIdx, rows, canGoUp, onGoUp, activate, selectRow, toggleExpand, collapseNode, fetchChildren, rangeSelectTo, selectedIds, toggleExpandSelected, menuOn, prepareContextMenuRow]);

        return (
            <div
                ref={setRef}
                data-testid="file-tree"
                className={cn("w-full h-full min-h-0 overflow-y-auto outline-none fb-tree-container p-1", className)}
                tabIndex={0}
                onKeyDown={handleKeyDown}
            >
                {rows.map((row, idx) => {
                    const isSelected = selectedIds.has(row.id);
                    const isFocused = focusIdx === idx;
                    return wrapTreeRow(row.id, idx, (
                        <div
                            data-testid="file-tree-node"
                            data-node-id={row.id}
                            data-fb-idx={idx}
                            ref={(el) => { rowRefs.current[idx] = el; }}
                            className={cn(
                                "flex items-center gap-1 py-0.5 cursor-pointer select-none rounded group",
                                isSelected && !isFocused && "bg-blue-100 dark:bg-accent/60 text-blue-900 dark:text-accent-foreground",
                                isFocused && "bg-blue-50 dark:bg-accent/80 text-foreground ring-1 ring-blue-400 dark:ring-ring",
                                !isSelected && !isFocused && "hover:bg-accent/40",
                            )}
                            style={{ fontSize: fontSize, paddingLeft: `${row.depth * 16 + 4}px`, paddingRight: 8 }}
                            onClick={(e) => handleClick(idx, e)}
                            onDoubleClick={() => activate(row)}
                        >
                            {/* Expand/collapse chevron */}
                            {row.isDir && !row.isNavUp && fetchChildren ? (
                                <button
                                    type="button"
                                    className="flex items-center justify-center w-4 h-4 shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleExpand(row);
                                    }}
                                    tabIndex={-1}
                                >
                                    {row.loading ? (
                                        <Loader2 size={12} className="animate-spin" />
                                    ) : (
                                        <ChevronRight
                                            size={14}
                                            className={cn(
                                                "transition-transform duration-150",
                                                row.expanded && "rotate-90"
                                            )}
                                        />
                                    )}
                                </button>
                            ) : (
                                <span className="w-4 shrink-0" />
                            )}

                            {/* Icon */}
                            <div className="flex items-center justify-center text-muted-foreground shrink-0">
                                {row.isNavUp ? (
                                    <ArrowUp size={16} />
                                ) : row.isDir ? (
                                    row.expanded ? (
                                        <FolderOpen size={16} className="text-blue-400 fill-blue-400/20" />
                                    ) : (
                                        <Folder size={16} className="text-blue-400 fill-blue-400/20" />
                                    )
                                ) : (
                                    <File size={16} />
                                )}
                            </div>

                            {/* Name — highlight type-ahead match on focused row */}
                            <span className="truncate flex-1">
                                {(() => {
                                    if (!isFocused || !searchDisplay) return row.name;
                                    const lower = row.name.toLowerCase();
                                    const pos = lower.startsWith(searchDisplay) ? 0 : lower.indexOf(searchDisplay);
                                    if (pos < 0) return row.name;
                                    return (
                                        <>
                                            {pos > 0 && row.name.slice(0, pos)}
                                            <span className="bg-amber-200/80 text-amber-900 border-b border-amber-500 dark:bg-sky-500/30 dark:text-sky-200 dark:border-sky-400">
                                                {row.name.slice(pos, pos + searchDisplay.length)}
                                            </span>
                                            {row.name.slice(pos + searchDisplay.length)}
                                        </>
                                    );
                                })()}
                            </span>
                        </div>
                    ));
                })}
            </div>
        );
    }
);

FileTree.displayName = 'FileTree';
