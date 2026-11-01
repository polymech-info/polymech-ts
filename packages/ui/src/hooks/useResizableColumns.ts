import { useState, useRef, useCallback, useMemo } from 'react';

export interface ColumnDef {
    /** Column key used in state */
    key: string;
    /** Initial width in px. 0 = flexible (no explicit width set) */
    defaultWidth: number;
    /** Whether this column can be resized (default: true) */
    resizable?: boolean;
}

export interface UseResizableColumnsOptions {
    columns: ColumnDef[];
    /** localStorage key for persistence. If omitted, no persistence. */
    storageKey?: string;
    /** Minimum column width in px (default: 60) */
    minWidth?: number;
}

export function useResizableColumns({ columns, storageKey, minWidth = 60 }: UseResizableColumnsOptions) {
    const defaultWidths = useMemo(() => {
        const w: Record<string, number> = {};
        for (const col of columns) w[col.key] = col.defaultWidth;
        return w;
    }, []);

    const [widths, setWidths] = useState<Record<string, number>>(() => {
        if (storageKey) {
            try {
                const stored = localStorage.getItem(storageKey);
                if (stored) {
                    const parsed = JSON.parse(stored);
                    // Merge with defaults in case new columns were added
                    return { ...defaultWidths, ...parsed };
                }
            } catch { }
        }
        return defaultWidths;
    });

    const dragRef = useRef<{ col: string; startX: number; startW: number } | null>(null);

    const onResizeStart = useCallback((col: string, e: React.MouseEvent) => {
        e.preventDefault();
        const th = (e.target as HTMLElement).closest('th');
        if (!th) return;

        const startW = th.offsetWidth;
        dragRef.current = { col, startX: e.clientX, startW };

        const onMove = (ev: MouseEvent) => {
            if (!dragRef.current) return;
            const delta = ev.clientX - dragRef.current.startX;
            const newW = Math.max(minWidth, dragRef.current.startW + delta);
            setWidths(prev => ({ ...prev, [dragRef.current!.col]: newW }));
        };

        const onUp = () => {
            dragRef.current = null;
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            // Persist after drag
            if (storageKey) {
                setWidths(cur => {
                    try { localStorage.setItem(storageKey, JSON.stringify(cur)); } catch { }
                    return cur;
                });
            }
        };

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }, [storageKey, minWidth]);

    /** Get inline style for a col element */
    const getColStyle = useCallback((key: string): React.CSSProperties => {
        const w = widths[key];
        return w ? { width: w } : {};
    }, [widths]);

    /** Get the resize handle props for a th element */
    const getResizeHandleProps = useCallback((key: string) => {
        const col = columns.find(c => c.key === key);
        if (!col || col.resizable === false) return null;
        return {
            onMouseDown: (e: React.MouseEvent) => onResizeStart(key, e),
            className: 'absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/40',
            style: {} as React.CSSProperties,
        };
    }, [columns, onResizeStart]);

    return { widths, getColStyle, getResizeHandleProps, onResizeStart };
}
