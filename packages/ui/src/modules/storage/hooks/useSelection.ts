import { useState, useCallback, useEffect } from 'react';
import { INode } from '@/modules/storage/types';

export interface UseSelectionProps {
    sorted: INode[];
    canGoUp: boolean;
    onSelect?: (nodes: INode[] | INode | null) => void;
}

export function useSelection({ sorted, canGoUp, onSelect }: UseSelectionProps) {
    const [focusIdx, setFocusIdx] = useState(-1);
    const [selected, setSelected] = useState<INode[]>([]);

    useEffect(() => {
        if (onSelect) onSelect(selected);
    }, [selected, onSelect]);

    const itemCount = sorted.length + (canGoUp ? 1 : 0);

    const getNode = useCallback((idx: number): INode | null => {
        if (canGoUp && idx === 0) return null;
        return sorted[canGoUp ? idx - 1 : idx] ?? null;
    }, [sorted, canGoUp]);

    const handleItemClick = useCallback((idx: number, e?: React.MouseEvent | React.KeyboardEvent) => {
        setFocusIdx(idx);
        const node = getNode(idx);
        if (!node) return;

        if (e && e.shiftKey && selected.length > 0) {
            const lastSelected = selected[selected.length - 1];
            const lastIdx = sorted.indexOf(lastSelected);
            if (lastIdx !== -1) {
                const actualLastIdx = canGoUp ? lastIdx + 1 : lastIdx;
                const start = Math.min(actualLastIdx, idx);
                const end = Math.max(actualLastIdx, idx);
                const newSel: INode[] = [];
                for (let i = start; i <= end; i++) {
                    const n = getNode(i);
                    if (n) newSel.push(n);
                }
                if (e.ctrlKey || e.metaKey) {
                    setSelected(Array.from(new Set([...selected, ...newSel])));
                } else {
                    setSelected(newSel);
                }
            } else {
                setSelected([node]);
            }
        } else if (e && (e.ctrlKey || e.metaKey)) {
            setSelected(prev => prev.some(n => n.path === node.path) ? prev.filter(n => n.path !== node.path) : [...prev, node]);
        } else {
            setSelected(prev => (prev.length === 1 && prev[0].path === node.path) ? [] : [node]);
        }
        document.querySelector<HTMLElement>('.fb-panel-container')?.focus({ preventScroll: true });
    }, [getNode, sorted, selected, canGoUp]);

    const clearSelection = useCallback(() => {
        setSelected([]);
        setFocusIdx(-1);
    }, []);

    /** Right-click: focus row; if target is not in the current selection, reduce selection to that item (Explorer-style). */
    const handleItemContextMenu = useCallback((idx: number) => {
        setFocusIdx(idx);
        const node = getNode(idx);
        if (!node) {
            setSelected([]);
            return;
        }
        setSelected((prev) => {
            if (prev.some((n) => n.path === node.path)) return prev;
            return [node];
        });
    }, [getNode]);

    return {
        focusIdx,
        setFocusIdx,
        selected,
        setSelected,
        itemCount,
        getNode,
        handleItemClick,
        handleItemContextMenu,
        clearSelection
    };
}
