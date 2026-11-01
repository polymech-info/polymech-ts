import React, { useCallback } from 'react';
import { INode } from '@/modules/storage/types';
import { getMimeCategory } from '@/modules/storage/helpers';

export interface UseKeyboardNavigationProps {
    viewMode: 'list' | 'thumbs' | 'tree';
    itemCount: number;
    focusIdx: number;
    setFocusIdx: (idx: number) => void;
    selected: INode[];
    setSelected: React.Dispatch<React.SetStateAction<INode[]>>;
    getNode: (idx: number) => INode | null;
    canGoUp: boolean;
    goUp: () => void;
    updatePath: (path: string) => void;
    openPreview: (node: INode) => void;
    scrollItemIntoView: (idx: number) => void;
    getGridCols: () => number;
    currentGlob: string;
    showFolders: boolean;
    setTempGlob: (glob: string) => void;
    setTempShowFolders: (val: boolean) => void;
    setFilterDialogOpen: (open: boolean) => void;
    setViewMode: (m: 'list' | 'thumbs' | 'tree') => void;
    setDisplayMode: (m: 'simple' | 'advanced') => void;
    cycleSort: () => void;
    searchBufferRef: React.MutableRefObject<string>;
    setSearchDisplay: (val: string) => void;
    clearSelection: () => void;
    onCopyRequest?: () => void;
    /** Shift+F10: open row context menu (list/thumbs; tree handles in FileTree). */
    onOpenContextMenu?: () => void;
}

export function useKeyboardNavigation({
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
    onOpenContextMenu
}: UseKeyboardNavigationProps) {

    const moveFocus = useCallback((next: number, shift: boolean, ctrl: boolean) => {
        next = Math.max(0, Math.min(itemCount - 1, next));
        setFocusIdx(next);
        const node = getNode(next);

        if (node) {
            if (shift && selected.length > 0) {
                const lastSelected = selected[selected.length - 1]; // Assume selected array maintains order
                // Reconstruct sequential selection
                // Getting indexOf requires knowing if it was shifted by canGoUp. This hook relies on parent handling that.
                // We'll just append it or set it, but we need exact index of last selected.
                // We delegate this to parent or infer it by iteration:
                let lastIdx = -1;
                for (let i = 0; i < itemCount; i++) {
                    const n = getNode(i);
                    if (n && n.path === lastSelected.path) {
                        lastIdx = i;
                        break;
                    }
                }

                if (lastIdx !== -1) {
                    const start = Math.min(lastIdx, next);
                    const end = Math.max(lastIdx, next);
                    const newSel: INode[] = [];
                    for (let i = start; i <= end; i++) {
                        const n = getNode(i);
                        if (n) newSel.push(n);
                    }
                    setSelected(ctrl ? Array.from(new Set([...selected, ...newSel])) : newSel);
                } else {
                    setSelected(ctrl ? [...selected, node] : [node]);
                }
            } else if (ctrl) {
                // Just move focus, don't change selection
            } else {
                setSelected([node]);
            }
        } else {
            setSelected([]);
        }
        scrollItemIntoView(next);
    }, [itemCount, setFocusIdx, getNode, selected, setSelected, scrollItemIntoView]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        // Only run if active element is the container or its descendants 
        // AND not if an input is focused.
        const active = document.activeElement;
        if (active?.tagName === 'INPUT' || active?.tagName === 'TEXTAREA') return;

        // In tree mode, we want to let FileTree handle most of the arrow keys and selections
        // so we don't accidentally synchronize the fallback grid's focusIdx.
        // We only want to handle global hotkeys like toggle view mode.
        if (viewMode === 'tree' && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', ' ', 'Backspace', 'Home', 'End', 'F10'].includes(e.key)) {
            return;
        }

        if (itemCount === 0) return;

        const cols = getGridCols();
        const ctrl = e.ctrlKey || e.metaKey;

        switch (e.key) {
            case '+': {
                if (e.shiftKey) {
                    e.preventDefault();
                    setTempGlob(currentGlob);
                    setTempShowFolders(showFolders);
                    setFilterDialogOpen(true);
                }
                break;
            }
            case 'ArrowRight': {
                e.preventDefault();
                moveFocus(focusIdx < itemCount - 1 ? focusIdx + 1 : 0, e.shiftKey, e.ctrlKey || e.metaKey);
                break;
            }
            case 'ArrowLeft': {
                e.preventDefault();
                moveFocus(focusIdx > 0 ? focusIdx - 1 : itemCount - 1, e.shiftKey, e.ctrlKey || e.metaKey);
                break;
            }
            case 'ArrowDown': {
                e.preventDefault();
                if (searchBufferRef.current) {
                    const searchStr = searchBufferRef.current;
                    let nextIdx = -1;
                    for (let i = 1; i < itemCount && nextIdx === -1; i++) {
                        const checkIdx = (focusIdx + i) % itemCount;
                        const node = getNode(checkIdx);
                        if (node && node.name.toLowerCase().startsWith(searchStr)) nextIdx = checkIdx;
                    }
                    for (let i = 1; i < itemCount && nextIdx === -1; i++) {
                        const checkIdx = (focusIdx + i) % itemCount;
                        const node = getNode(checkIdx);
                        if (node && node.name.toLowerCase().includes(searchStr)) nextIdx = checkIdx;
                    }
                    if (nextIdx !== -1) moveFocus(nextIdx, e.shiftKey, e.ctrlKey || e.metaKey);
                } else {
                    moveFocus(focusIdx + cols, e.shiftKey, e.ctrlKey || e.metaKey);
                }
                break;
            }
            case 'ArrowUp': {
                e.preventDefault();
                if (searchBufferRef.current) {
                    const searchStr = searchBufferRef.current;
                    let prevIdx = -1;
                    for (let i = 1; i < itemCount && prevIdx === -1; i++) {
                        const checkIdx = (focusIdx - i + itemCount) % itemCount;
                        const node = getNode(checkIdx);
                        if (node && node.name.toLowerCase().startsWith(searchStr)) prevIdx = checkIdx;
                    }
                    for (let i = 1; i < itemCount && prevIdx === -1; i++) {
                        const checkIdx = (focusIdx - i + itemCount) % itemCount;
                        const node = getNode(checkIdx);
                        if (node && node.name.toLowerCase().includes(searchStr)) prevIdx = checkIdx;
                    }
                    if (prevIdx !== -1) moveFocus(prevIdx, e.shiftKey, e.ctrlKey || e.metaKey);
                } else {
                    moveFocus(focusIdx - cols, e.shiftKey, e.ctrlKey || e.metaKey);
                }
                break;
            }
            case 'Enter': {
                e.preventDefault();
                if (focusIdx < 0) break;
                const node = getNode(focusIdx);
                if (!node) { goUp(); break; }
                const cat = getMimeCategory(node);
                if (cat === 'dir') updatePath(node.path || node.name);
                else openPreview(node);
                break;
            }
            case ' ': {
                e.preventDefault();
                if (focusIdx < 0) break;
                const node = getNode(focusIdx);
                if (!node) break;
                setSelected(prev => prev.some(n => n.path === node.path) ? prev.filter(n => n.path !== node.path) : [...prev, node]);
                break;
            }
            case 'Backspace': {
                e.preventDefault();
                if (searchBufferRef.current.length > 0) {
                    searchBufferRef.current = searchBufferRef.current.slice(0, -1);
                    setSearchDisplay(searchBufferRef.current);
                    if (searchBufferRef.current.length > 0) {
                        const searchStr = searchBufferRef.current;
                        let foundIdx = -1;
                        const start = Math.max(0, focusIdx);
                        for (let i = 0; i < itemCount && foundIdx === -1; i++) {
                            const checkIdx = (start + i) % itemCount;
                            const node = getNode(checkIdx);
                            if (node && node.name.toLowerCase().startsWith(searchStr)) foundIdx = checkIdx;
                        }
                        for (let i = 0; i < itemCount && foundIdx === -1; i++) {
                            const checkIdx = (start + i) % itemCount;
                            const node = getNode(checkIdx);
                            if (node && node.name.toLowerCase().includes(searchStr)) foundIdx = checkIdx;
                        }
                        if (foundIdx !== -1) moveFocus(foundIdx, false, false);
                    }
                } else {
                    goUp();
                }
                break;
            }
            case 'Home': {
                e.preventDefault();
                moveFocus(0, e.shiftKey, e.ctrlKey || e.metaKey);
                break;
            }
            case 'End': {
                e.preventDefault();
                moveFocus(itemCount - 1, e.shiftKey, e.ctrlKey || e.metaKey);
                break;
            }
            case 'Escape': {
                e.preventDefault();
                if (searchBufferRef.current !== '') {
                    searchBufferRef.current = '';
                    setSearchDisplay('');
                } else {
                    clearSelection();
                }
                break;
            }
            case 'F10': {
                if (e.shiftKey && onOpenContextMenu) {
                    e.preventDefault();
                    onOpenContextMenu();
                }
                break;
            }
            case 'F1': {
                if (e.altKey) {
                    e.preventDefault();
                    document.getElementById('fb-mount-trigger')?.click();
                }
                break;
            }
            case 'F5': {
                if (onCopyRequest) {
                    e.preventDefault();
                    onCopyRequest();
                }
                break;
            }
            case '1': {
                if (e.altKey) {
                    e.preventDefault();
                    setViewMode('tree');
                    setDisplayMode('simple');
                }
                break;
            }
            case '2': {
                if (e.altKey) {
                    e.preventDefault();
                    setViewMode('list');
                    setDisplayMode('simple');
                }
                break;
            }
            case '3': {
                if (e.altKey) {
                    e.preventDefault();
                    setViewMode('thumbs');
                    setDisplayMode('simple');
                }
                break;
            }
            case 's': {
                if (e.altKey) cycleSort();
                break;
            }
            case 'a': {
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    const allNodes: INode[] = [];
                    for (let i = 0; i < itemCount; i++) {
                        const n = getNode(i);
                        if (n) allNodes.push(n);
                    }
                    setSelected(allNodes);
                }
                break;
            }
            case 'Meta':
            case 'Control':
            case 'Shift':
            case 'Alt':
                break;
            default: {
                if (e.ctrlKey || e.metaKey || e.altKey) return;
                if (e.key.length === 1) {
                    const char = e.key.toLowerCase();
                    searchBufferRef.current += char;
                    setSearchDisplay(searchBufferRef.current);
                    const searchStr = searchBufferRef.current;
                    let foundIdx = -1;
                    const start = Math.max(0, focusIdx);

                    for (let i = 0; i < itemCount && foundIdx === -1; i++) {
                        const checkIdx = (start + i) % itemCount;
                        const node = getNode(checkIdx);
                        if (node && node.name.toLowerCase().startsWith(searchStr)) foundIdx = checkIdx;
                    }
                    for (let i = 0; i < itemCount && foundIdx === -1; i++) {
                        const checkIdx = (start + i) % itemCount;
                        const node = getNode(checkIdx);
                        if (node && node.name.toLowerCase().includes(searchStr)) foundIdx = checkIdx;
                    }
                    if (foundIdx !== -1) moveFocus(foundIdx, false, false);
                }
                break;
            }
        }
    }, [
        viewMode, itemCount, getGridCols, currentGlob, showFolders, setTempGlob, setTempShowFolders,
        setFilterDialogOpen, moveFocus, focusIdx, searchBufferRef, getNode, setSearchDisplay, goUp,
        updatePath, openPreview, selected, setSelected, clearSelection, setViewMode, setDisplayMode, cycleSort, onCopyRequest,
        onOpenContextMenu
    ]);

    return { handleKeyDown, moveFocus };
}
