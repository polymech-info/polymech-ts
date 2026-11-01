import React, { useMemo, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ChevronRight, Globe, MapPin, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface GadmNode {
    name: string;
    gid: string;
    level: number;
    hasChildren: boolean;
    label?: string;
    data?: any;
}

export interface GadmTreePickerApi {
    expandPath: (gids: string[]) => void;
    setSelectedIds: (gids: string[]) => void;
}

export interface GadmTreePickerProps {
    data: GadmNode[];
    onSelect?: (node: GadmNode) => void;
    onSelectionChange?: (selectedNodes: GadmNode[], selectedIds: Set<string>) => void;
    onActivate?: (node: GadmNode) => void;
    selectedId?: string;
    className?: string;
    fetchChildren?: (node: GadmNode) => Promise<GadmNode[]>;
    fontSize?: number;
    apiRef?: React.MutableRefObject<GadmTreePickerApi | null>;
    expandMapExternal?: Record<string, ExpandState>;
    setExpandMapExternal?: React.Dispatch<React.SetStateAction<Record<string, ExpandState>>>;
    initialSelectedIds?: string[];
}

type TreeRow = {
    id: string;
    name: string;
    displayName: string;
    node: GadmNode;
    depth: number;
    parentId: string | null;
    expanded: boolean;
    loading: boolean;
};

export interface ExpandState {
    expanded: boolean;
    children: GadmNode[];
    loading: boolean;
}

function sortNodesAsc(nodes: GadmNode[]): GadmNode[] {
    return [...nodes].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
}

function buildRows(
    nodes: GadmNode[],
    expandMap: Record<string, ExpandState>,
    depth: number = 0,
    parentId: string | null = null
): TreeRow[] {
    const rows: TreeRow[] = [];
    for (const n of nodes) {
        const state = expandMap[n.gid];
        const expanded = state?.expanded ?? false;
        const loading = state?.loading ?? false;
        // If we fetched children and got none, treat as leaf (no arrow)
        const knownEmpty = state && !state.loading && state.children !== undefined && state.children.length === 0;
        const effectiveNode = knownEmpty ? { ...n, hasChildren: false } : n;
        rows.push({
            id: n.gid,
            name: n.name,
            displayName: n.label || n.name,
            node: effectiveNode,
            depth,
            parentId,
            expanded,
            loading,
        });
        if (n.hasChildren && expanded && state?.children?.length) {
            const childRows = buildRows(
                sortNodesAsc(state.children),
                expandMap,
                depth + 1,
                n.gid
            );
            rows.push(...childRows);
        }
    }
    return rows;
}

function findMatchIdx(rows: TreeRow[], str: string, startFrom: number, direction: 1 | -1 = 1): number {
    const count = rows.length;
    for (let i = 0; i < count; i++) {
        const idx = ((startFrom + i * direction) % count + count) % count;
        if (rows[idx].displayName.toLowerCase().startsWith(str)) return idx;
    }
    for (let i = 0; i < count; i++) {
        const idx = ((startFrom + i * direction) % count + count) % count;
        if (rows[idx].displayName.toLowerCase().includes(str)) return idx;
    }
    return -1;
}

export const GadmTreePicker = React.forwardRef<HTMLDivElement, GadmTreePickerProps>(
    ({ data, onSelect, onSelectionChange, onActivate, selectedId, className, fetchChildren, fontSize = 14, apiRef, expandMapExternal, setExpandMapExternal, initialSelectedIds }, forwardedRef) => {
        const [expandMapInternal, setExpandMapInternal] = useState<Record<string, ExpandState>>({});
        const expandMap = expandMapExternal ?? expandMapInternal;
        const setExpandMap = setExpandMapExternal ?? setExpandMapInternal;
        const rows = useMemo(() => buildRows(data, expandMap), [data, expandMap]);
        const [focusIdx, setFocusIdx] = useState(0);
        const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set(initialSelectedIds ?? []));
        const anchorIdx = useRef<number>(0);
        const containerRef = useRef<HTMLDivElement>(null);
        const rowRefs = useRef<(HTMLDivElement | null)[]>([]);

        const searchBuf = useRef('');
        const searchTimer = useRef<any>(null);
        const [searchDisplay, setSearchDisplay] = useState('');

        const setRef = useCallback((el: HTMLDivElement | null) => {
            (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
            if (typeof forwardedRef === 'function') forwardedRef(el);
            else if (forwardedRef) (forwardedRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
        }, [forwardedRef]);

        const [pendingExpands, setPendingExpands] = useState<string[]>([]);

        React.useImperativeHandle(apiRef, () => ({
            expandPath: (gids: string[]) => {
                setPendingExpands(gids);
            },
            setSelectedIds: (gids: string[]) => {
                setSelectedIds(new Set(gids));
            }
        }), []);



        useEffect(() => {
            if (selectedId) {
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

        const prevDataRef = useRef(data);
        useLayoutEffect(() => {
            if (data === prevDataRef.current && rows.length > 0) return;
            prevDataRef.current = data;

            if (rows.length === 0) return;

            if (selectedId) {
                const existingIdx = rows.findIndex(r => r.id === selectedId);
                if (existingIdx >= 0) {
                    containerRef.current?.focus({ preventScroll: true });
                    return;
                }
            }

            setFocusIdx(0);
            anchorIdx.current = 0;
            containerRef.current?.focus({ preventScroll: true });
        }, [data, rows, selectedId]);

        useEffect(() => {
            rowRefs.current[focusIdx]?.scrollIntoView({ block: 'nearest' });
        }, [focusIdx]);

        const onSelectionChangeRef = useRef(onSelectionChange);
        onSelectionChangeRef.current = onSelectionChange;
        const rowsRef = useRef(rows);
        rowsRef.current = rows;

        useEffect(() => {
            if (!onSelectionChangeRef.current) return;
            const currentRows = rowsRef.current;
            const selectedNodes = currentRows.filter(r => selectedIds.has(r.id)).map(r => {
                const node = r.node;

                // If it doesn't have parent GID_0 but is nested, walk up to construct the hierarchy
                if (!node.data?.GID_0 && r.depth > 0) {
                    const syntheticData = { ...node.data, gid: node.gid, level: node.level };
                    let curr: TreeRow | undefined = r;
                    while (curr) {
                        syntheticData[`GID_${curr.node.level}`] = curr.id;
                        syntheticData[`NAME_${curr.node.level}`] = curr.name;
                        const pId = curr.parentId;
                        curr = pId ? currentRows.find(or => or.id === pId) : undefined;
                    }
                    return { ...node, data: syntheticData };
                }

                // Always ensure GID of its own level and explicit gid property are populated
                if (!node.data[`GID_${node.level}`] || !node.data.gid) {
                    const syntheticData = { ...node.data, gid: node.gid, level: node.level };
                    syntheticData[`GID_${node.level}`] = node.gid;
                    syntheticData[`NAME_${node.level}`] = node.name;
                    return { ...node, data: syntheticData };
                }

                return node;
            });
            onSelectionChangeRef.current(selectedNodes, selectedIds);
            console.log('selected nodes updated', selectedNodes.length);
        }, [selectedIds, rows, data.length]);

        const toggleExpand = useCallback(async (row: TreeRow) => {
            if (!row.node.hasChildren || !fetchChildren) return;
            const path = row.node.gid;
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

        // Effect to process pending automatic expansions synchronously with the rendered rows
        useEffect(() => {
            if (pendingExpands.length > 0) {
                const targetGid = pendingExpands[0];
                const row = rows.find(r => r.id === targetGid);
                if (row) {
                    if (row.loading) return; // Wait for children to load

                    if (!row.expanded && row.node.hasChildren && fetchChildren) {
                        toggleExpand(row);
                    } else if (row.expanded || !row.node.hasChildren) {
                        // Move to next pending target if it's already expanded or has no children
                        setPendingExpands(prev => prev.slice(1));
                    }
                } else {
                    const isAnyLoading = rows.some(r => r.loading);
                    if (!isAnyLoading) {
                        setPendingExpands(prev => prev.slice(1));
                    }
                }
            }
        }, [pendingExpands, rows, toggleExpand, fetchChildren]);

        const toggleExpandSelected = useCallback(async () => {
            if (!fetchChildren || selectedIds.size === 0) return;
            const selectedDirs = rows.filter(r => selectedIds.has(r.id) && r.node.hasChildren);
            if (selectedDirs.length === 0) return;

            const anyCollapsed = selectedDirs.some(r => !r.expanded);

            if (!anyCollapsed) {
                setExpandMap(prev => {
                    const next = { ...prev };
                    for (const r of selectedDirs) {
                        next[r.node.gid] = { ...next[r.node.gid], expanded: false };
                    }
                    return next;
                });
            } else {
                for (const r of selectedDirs) {
                    if (!r.expanded) {
                        await toggleExpand(r);
                    }
                }
            }
        }, [fetchChildren, selectedIds, rows, toggleExpand]);

        const collapseNode = useCallback((row: TreeRow) => {
            if (!row.node.hasChildren) return;
            setExpandMap(prev => ({
                ...prev,
                [row.node.gid]: { ...prev[row.node.gid], expanded: false },
            }));
        }, []);

        const activate = useCallback((row: TreeRow) => {
            onActivate?.(row.node);
        }, [onActivate]);

        const selectRow = useCallback((idx: number) => {
            setFocusIdx(idx);
            anchorIdx.current = idx;
            const row = rows[idx];
            if (!row) {
                setSelectedIds(new Set());
                return;
            }
            setSelectedIds(new Set([row.id]));
            onSelect?.(row.node);
        }, [rows, onSelect]);

        const toggleSelectRow = useCallback((idx: number) => {
            setFocusIdx(idx);
            anchorIdx.current = idx;
            const row = rows[idx];
            if (!row) return;
            setSelectedIds(prev => {
                const next = new Set(prev);
                if (next.has(row.id)) next.delete(row.id);
                else next.add(row.id);
                return next;
            });
        }, [rows]);

        const rangeSelectTo = useCallback((idx: number) => {
            setFocusIdx(idx);
            const start = Math.min(anchorIdx.current, idx);
            const end = Math.max(anchorIdx.current, idx);
            const ids = new Set<string>();
            for (let i = start; i <= end; i++) {
                const r = rows[i];
                if (r) ids.add(r.id);
            }
            setSelectedIds(ids);
        }, [rows]);

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

        const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
            if (e.altKey) return;

            const count = rows.length;
            if (count === 0) return;

            switch (e.key) {
                case 'ArrowDown': {
                    e.preventDefault();
                    if (searchBuf.current) {
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
                    if (fetchChildren && selectedIds.size > 1) {
                        const selectedDirs = rows.filter(r => selectedIds.has(r.id) && r.node.hasChildren && !r.expanded);
                        if (selectedDirs.length > 0) {
                            for (const r of selectedDirs) toggleExpand(r);
                            break;
                        }
                    }
                    const rowR = rows[focusIdx];
                    if (!rowR) break;
                    if (rowR.node.hasChildren && fetchChildren) {
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
                    const visibleIds = new Set(rows.map(r => r.id));
                    const cleanIds = new Set([...selectedIds].filter(id => visibleIds.has(id)));
                    if (cleanIds.size !== selectedIds.size) setSelectedIds(cleanIds);

                    if (fetchChildren && cleanIds.size > 1) {
                        const selectedDirs = rows.filter(r => cleanIds.has(r.id) && r.node.hasChildren && r.expanded);
                        if (selectedDirs.length > 0) {
                            for (const r of selectedDirs) collapseNode(r);
                            break;
                        }
                    }
                    const rowL = rows[focusIdx];
                    if (!rowL) break;
                    if (rowL.node.hasChildren && rowL.expanded && fetchChildren) {
                        collapseNode(rowL);
                    } else if (rowL.parentId) {
                        const parentIdx = rows.findIndex(r => r.id === rowL.parentId);
                        if (parentIdx >= 0) {
                            const parentRow = rows[parentIdx];
                            if (parentRow) collapseNode(parentRow);
                            selectRow(parentIdx);
                        }
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
                        const hasSelectedDirs = rows.some(r => selectedIds.has(r.id) && r.node.hasChildren);
                        if (hasSelectedDirs) {
                            toggleExpandSelected();
                            break;
                        }
                    }
                    const row = rows[focusIdx];
                    if (row?.node.hasChildren && fetchChildren) {
                        toggleExpand(row);
                    } else if (row) {
                        activate(row);
                    }
                    break;
                }
                case 'a': {
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        const all = new Set(rows.map(r => r.id));
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
                default: {
                    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
                        const char = e.key.toLowerCase();
                        searchBuf.current += char;
                        setSearchDisplay(searchBuf.current);

                        if (searchTimer.current) clearTimeout(searchTimer.current);
                        searchTimer.current = setTimeout(() => { searchBuf.current = ''; setSearchDisplay(''); }, 1000);

                        const str = searchBuf.current;
                        const found = findMatchIdx(rows, str, focusIdx, 1);
                        if (found >= 0) selectRow(found);
                    }
                    break;
                }
            }
        }, [focusIdx, rows, activate, selectRow, toggleExpand, collapseNode, fetchChildren, rangeSelectTo, selectedIds, toggleExpandSelected]);

        return (
            <div
                ref={setRef}
                data-testid="gadm-tree"
                className={cn("w-full h-full min-h-0 overflow-y-auto outline-none fb-tree-container p-1", className)}
                tabIndex={0}
                onKeyDown={handleKeyDown}
            >
                {rows.map((row, idx) => {
                    const isSelected = selectedIds.has(row.id);
                    const isFocused = focusIdx === idx;
                    return (
                        <div
                            key={`${row.id}-${idx}`}
                            data-testid="gadm-tree-node"
                            data-node-id={row.id}
                            ref={(el) => { rowRefs.current[idx] = el; }}
                            className={cn(
                                "flex items-center gap-1 py-0.5 cursor-pointer select-none rounded group",
                                isSelected && !isFocused && "bg-sky-100 dark:bg-sky-900/50 text-sky-900 dark:text-sky-100",
                                isFocused && "bg-sky-50 dark:bg-sky-800 text-sky-900 dark:text-sky-50 ring-1 ring-sky-400 dark:ring-sky-500",
                                !isSelected && !isFocused && "hover:bg-sky-50/50 dark:hover:bg-sky-900/40 text-slate-700 dark:text-slate-300",
                            )}
                            style={{ fontSize: fontSize, paddingLeft: `${row.depth * 16 + 4}px`, paddingRight: 8 }}
                            onClick={() => {
                                setFocusIdx(idx);
                                anchorIdx.current = idx;
                                containerRef.current?.focus({ preventScroll: true });
                            }}
                            onDoubleClick={() => {
                                if (row.node.hasChildren && fetchChildren) {
                                    toggleExpand(row);
                                }
                                activate(row);
                            }}
                        >
                            {row.node.hasChildren && fetchChildren ? (
                                <button
                                    type="button"
                                    className="flex items-center justify-center w-4 h-4 shrink-0 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
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

                            <div className="flex items-center justify-center text-slate-400 dark:text-slate-500 shrink-0">
                                {row.node.level === 0 ? (
                                    <Globe size={16} className={cn(row.expanded && "text-sky-500")} />
                                ) : (
                                    <MapPin size={16} className={cn(row.expanded && "text-sky-500")} />
                                )}
                            </div>

                            <span className="truncate flex-1 ml-1">
                                {(() => {
                                    const label = row.displayName;
                                    if (!isFocused || !searchDisplay) return label;
                                    const lower = label.toLowerCase();
                                    const pos = lower.startsWith(searchDisplay) ? 0 : lower.indexOf(searchDisplay);
                                    if (pos < 0) return label;
                                    return (
                                        <>
                                            {pos > 0 && label.slice(0, pos)}
                                            <span className="bg-amber-200/80 text-amber-900 border-b border-amber-500 dark:bg-sky-500/30 dark:text-sky-200 dark:border-sky-400">
                                                {label.slice(pos, pos + searchDisplay.length)}
                                            </span>
                                            {label.slice(pos + searchDisplay.length)}
                                        </>
                                    );
                                })()}
                            </span>
                            <span className="text-[10px] text-slate-400 ml-1.5 opacity-70 shrink-0">
                                L{row.node.level}
                            </span>
                            <button
                                type="button"
                                tabIndex={-1}
                                className="ml-1.5 shrink-0 relative inline-flex items-center"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleSelectRow(idx);
                                    containerRef.current?.focus({ preventScroll: true });
                                }}
                            >
                                <span className={cn(
                                    "w-7 h-4 rounded-full transition-colors duration-200",
                                    isSelected
                                        ? "bg-indigo-500"
                                        : "bg-gray-300 dark:bg-gray-600 group-hover:bg-gray-400 dark:group-hover:bg-gray-500"
                                )} />
                                <span className={cn(
                                    "absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform duration-200",
                                    isSelected && "translate-x-3"
                                )} />
                            </button>
                        </div>
                    );
                })}
            </div>
        );
    }
);

GadmTreePicker.displayName = 'GadmTreePicker';
