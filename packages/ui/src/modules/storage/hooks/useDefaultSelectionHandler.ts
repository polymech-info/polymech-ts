import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import type { INode } from '@/modules/storage/types';

export interface UseDefaultSelectionHandlerProps {
    sorted: INode[];
    canGoUp: boolean;
    rawGoUp: () => void;
    currentPath: string;
    loading: boolean;
    viewMode: 'list' | 'thumbs' | 'tree';
    autoFocus?: boolean;
    index?: boolean;
    isSearchMode?: boolean;
    initialFile?: string;
    allowFallback?: boolean;

    // Selection setters (from useSelection)
    setFocusIdx: (idx: number) => void;
    setSelected: React.Dispatch<React.SetStateAction<INode[]>>;

    // External onSelect
    onSelect?: (nodes: INode[] | INode | null) => void;

    // Pending file select from keyboard handler
    pendingFileSelect: string | null;
    setPendingFileSelect: (v: string | null) => void;

    // Scroll helper
    scrollItemIntoView: (idx: number) => void;

    // Refs
    containerRef: React.RefObject<HTMLDivElement | null>;
    listRef: React.RefObject<HTMLDivElement | null>;
}

export function useDefaultSelectionHandler({
    sorted,
    canGoUp,
    rawGoUp,
    currentPath,
    loading,
    viewMode,
    autoFocus = true,
    index = true,
    isSearchMode = false,
    initialFile,
    allowFallback = true,
    setFocusIdx,
    setSelected,
    onSelect,
    pendingFileSelect,
    setPendingFileSelect,
    scrollItemIntoView,
    containerRef,
    listRef,
}: UseDefaultSelectionHandlerProps) {

    // ── Return target (go-up → re-select the dir we came from) ───
    const returnTargetRef = useRef<string | null>(null);
    const autoOpenedRef = useRef(false);
    const lastSortedRef = useRef<INode[] | null>(null);

    const goUp = useCallback(() => {
        if (!canGoUp) return;
        const parts = currentPath.split('/').filter(Boolean);
        const currentDirName = parts[parts.length - 1];
        if (currentDirName) {
            returnTargetRef.current = currentDirName;
        }
        rawGoUp();
    }, [canGoUp, currentPath, rawGoUp]);

    // ── Focus / Auto-Select Engine (runs after content mounts) ───
    // Only runs the full auto-select (readme, first-item) when sorted
    // *actually changes* (i.e. a new directory was loaded).  This prevents
    // the effect from snapping the selection back to readme.md when an
    // unrelated state update (e.g. pendingFileSelect → null) re-fires it.
    useLayoutEffect(() => {
        if (loading || sorted.length === 0) return;

        const isNewListing = sorted !== lastSortedRef.current;
        lastSortedRef.current = sorted;

        // If the listing hasn't changed, nothing to auto-select.
        if (!isNewListing && !returnTargetRef.current) return;

        let targetIdx = 0;
        const target = returnTargetRef.current;

        if (target) {
            const idx = sorted.findIndex(n => n.name === target);
            if (idx >= 0) {
                targetIdx = canGoUp ? idx + 1 : idx;
                setSelected([sorted[idx]]);
            }
            returnTargetRef.current = null;
        } else {
            let readmeIdx = -1;
            const hasPendingInitial = (!autoOpenedRef.current && initialFile) || pendingFileSelect;

            if (index && !isSearchMode && !hasPendingInitial) {
                readmeIdx = sorted.findIndex(n => n.name.toLowerCase() === 'readme.md');
            }

            if (readmeIdx >= 0) {
                targetIdx = canGoUp ? readmeIdx + 1 : readmeIdx;
                setSelected([sorted[readmeIdx]]);
            } else {
                setSelected(canGoUp || !allowFallback ? [] : [sorted[0]]);
            }
        }

        setFocusIdx(targetIdx);

        const active = document.activeElement;
        const safeToFocus = autoFocus && active?.tagName !== 'INPUT' && !active?.closest('[role="dialog"]');

        if (safeToFocus) {
            if (viewMode === 'tree') {
                const treeEl = containerRef.current?.querySelector('.fb-tree-container') as HTMLElement;
                treeEl?.focus({ preventScroll: true });
            } else {
                containerRef.current?.focus({ preventScroll: true });
                if (listRef.current) {
                    const el = listRef.current.querySelector(`[data-fb-idx="${targetIdx}"]`) as HTMLElement;
                    el?.scrollIntoView({ block: 'nearest' });
                }
            }
        }
    }, [sorted, canGoUp, loading, viewMode, autoFocus, index, isSearchMode, initialFile, pendingFileSelect, allowFallback]);

    // ── Auto-open ?file= on initial load ─────────────────────────
    useEffect(() => {
        const fileToOpen = pendingFileSelect || (!autoOpenedRef.current && initialFile ? initialFile : null);
        if (!fileToOpen || sorted.length === 0) return;

        const target = sorted.find(n => n.name === fileToOpen);
        if (!target) return;

        if (!pendingFileSelect) {
            autoOpenedRef.current = true;
        } else {
            setPendingFileSelect(null);
        }

        const idx = sorted.indexOf(target);
        if (idx >= 0) {
            const newFocusIdx = canGoUp ? idx + 1 : idx;
            setFocusIdx(newFocusIdx);
            const newlySelected = [target];
            setSelected(newlySelected);
            if (onSelect) {
                onSelect(newlySelected);
            }
            requestAnimationFrame(() => scrollItemIntoView(newFocusIdx));
        }
    }, [sorted, initialFile, pendingFileSelect, canGoUp, scrollItemIntoView, onSelect]);

    return { goUp };
}
