import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { INode, SortKey } from '@/modules/storage/types';
import { useKeyboardNavigation } from './useKeyboardNavigation';

export interface UseDefaultKeyboardHandlerProps {
    // Core selection state (from useSelection)
    focusIdx: number;
    setFocusIdx: (idx: number) => void;
    selected: INode[];
    setSelected: React.Dispatch<React.SetStateAction<INode[]>>;
    itemCount: number;
    getNode: (idx: number) => INode | null;
    clearSelection: () => void;

    // Navigation
    canGoUp: boolean;
    goUp: () => void;
    updatePath: (path: string) => void;
    openPreview: (node: INode) => void;

    // View / display
    viewMode: 'list' | 'thumbs' | 'tree';
    setViewMode: (m: 'list' | 'thumbs' | 'tree') => void;
    setDisplayMode: (m: 'simple' | 'advanced') => void;
    currentGlob: string;
    showFolders: boolean;
    cycleSort: () => void;

    // Filter dialog controls
    setTempGlob: (glob: string) => void;
    setTempShowFolders: (val: boolean) => void;
    setFilterDialogOpen: (open: boolean) => void;

    // Refs
    containerRef: React.RefObject<HTMLDivElement | null>;

    // Externally provided utilities (to avoid circular deps)
    scrollItemIntoView: (idx: number) => void;
    getGridCols: () => number;

    // Options
    autoFocus?: boolean;
    allowFallback?: boolean;
    currentPath: string;

    // External search query callback (for inline search mode)
    onSearchQueryChange?: (q: string) => void;
    searchQuery?: string;
    isSearchMode?: boolean;

    // External onSelect for pending search selection
    onSelect?: (nodes: INode[] | INode | null) => void;
    sorted: INode[];
    onCopyRequest?: () => void;
    onOpenContextMenu?: () => void;
}

export function useDefaultKeyboardHandler({
    focusIdx,
    setFocusIdx,
    selected,
    setSelected,
    itemCount,
    getNode,
    clearSelection,
    canGoUp,
    goUp,
    updatePath,
    openPreview,
    viewMode,
    setViewMode,
    setDisplayMode,
    currentGlob,
    showFolders,
    cycleSort,
    setTempGlob,
    setTempShowFolders,
    setFilterDialogOpen,
    containerRef,
    scrollItemIntoView,
    getGridCols,
    autoFocus = true,
    allowFallback = true,
    currentPath,
    onSearchQueryChange,
    searchQuery,
    isSearchMode,
    onSelect,
    sorted,
    onCopyRequest,
    onOpenContextMenu,
}: UseDefaultKeyboardHandlerProps) {

    // ── Search state ─────────────────────────────────────────────
    const searchBufferRef = useRef<string>('');
    const [searchDisplay, setSearchDisplay] = useState('');
    const [searchOpen, setSearchOpen] = useState(false);
    const [pendingSearchSelection, setPendingSearchSelection] = useState<string | null>(null);

    // Clear typeahead buffer on directory change
    useEffect(() => {
        searchBufferRef.current = '';
        setSearchDisplay('');
    }, [currentPath]);

    // ── Global keyboard shortcut for search (Ctrl+F / F3) ────────
    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'F3' || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f')) {
                const panels = document.querySelectorAll('.fb-panel-container');
                const isOnlyPanel = panels.length === 1;
                const iAmActive = containerRef.current?.hasAttribute('data-active-panel');
                const noActivePanels = !document.querySelector('.fb-panel-container[data-active-panel]');
                const iAmFirst = panels[0] === containerRef.current;

                if (isOnlyPanel || iAmActive || (noActivePanels && iAmFirst)) {
                    setSearchOpen(true);
                    e.preventDefault();
                }
            }
        };

        window.addEventListener('keydown', handleGlobalKeyDown, { capture: true });
        return () => window.removeEventListener('keydown', handleGlobalKeyDown, { capture: true });
    }, []);

    // ── Resolve pending selection from search ────────────────────
    useEffect(() => {
        if (pendingSearchSelection && sorted.length > 0) {
            const idx = sorted.findIndex(n => n.name === pendingSearchSelection);
            if (idx >= 0) {
                const newFocusIdx = canGoUp ? idx + 1 : idx;
                setFocusIdx(newFocusIdx);
                const newlySelected = [sorted[idx]];
                setSelected(newlySelected);
                setPendingSearchSelection(null);

                if (onSelect) {
                    onSelect(newlySelected);
                }

                requestAnimationFrame(() => scrollItemIntoView(newFocusIdx));
            }
        }
    }, [sorted, pendingSearchSelection, canGoUp, scrollItemIntoView, onSelect]);

    // ── Wire up the core keyboard navigation hook ────────────────
    const { handleKeyDown } = useKeyboardNavigation({
        viewMode,
        itemCount,
        focusIdx,
        setFocusIdx,
        selected,
        setSelected,
        getNode,
        canGoUp,
        goUp,
        updatePath,
        openPreview,
        scrollItemIntoView,
        getGridCols,
        currentGlob,
        showFolders,
        setTempGlob,
        setTempShowFolders,
        setFilterDialogOpen,
        setViewMode,
        setDisplayMode,
        cycleSort,
        searchBufferRef,
        setSearchDisplay,
        clearSelection,
        onCopyRequest,
        onOpenContextMenu,
    });

    // ── Focus management on view mode change ─────────────────────
    const prevViewModeRef = useRef(viewMode);
    useEffect(() => {
        if (viewMode !== prevViewModeRef.current) {
            prevViewModeRef.current = viewMode;
            const timeout = setTimeout(() => {
                if (!containerRef.current) return;
                const active = document.activeElement;
                if (active?.tagName === 'INPUT' || active?.closest('[role="dialog"]')) return;

                if (viewMode === 'tree') {
                    const treeEl = containerRef.current.querySelector('.fb-tree-container') as HTMLElement;
                    if (treeEl) treeEl.focus({ preventScroll: true });
                } else {
                    containerRef.current.focus({ preventScroll: true });
                    scrollItemIntoView(focusIdx);
                }
            }, 50);
            return () => clearTimeout(timeout);
        } else if (allowFallback) {
            const active = document.activeElement;
            if (active?.tagName === 'INPUT' || active?.closest('[role="dialog"]')) return;
            containerRef.current?.focus({ preventScroll: true });
        }
    }, [viewMode, currentPath, allowFallback, focusIdx, scrollItemIntoView]);

    return {
        searchOpen,
        setSearchOpen,
        searchDisplay,
        searchBufferRef,
        pendingSearchSelection,
        setPendingSearchSelection,
        handleKeyDown
    };
}
