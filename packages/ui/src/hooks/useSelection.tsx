import { useState, useCallback, useEffect } from 'react';
import { useLayout } from '@/modules/layout/LayoutContext';

interface UseSelectionProps {
    pageId: string;
}

export function useSelection({ pageId }: UseSelectionProps) {
    const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
    const { loadedPages } = useLayout();

    const selectWidget = useCallback((widgetId: string) => {
        setSelectedWidgetId(widgetId);
    }, []);

    const clearSelection = useCallback(() => {
        setSelectedWidgetId(null);
    }, []);

    // Flatten widgets for linear navigation
    const getFlattenedWidgets = useCallback(() => {
        const layout = loadedPages.get(pageId);
        if (!layout) return [];

        const widgets: string[] = [];

        const traverse = (container: any) => {
            // Widgets first (as per render order)
            if (container.widgets) {
                const sortedWidgets = [...container.widgets].sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
                sortedWidgets.forEach((w: any) => widgets.push(w.id));
            }

            // Then children
            if (container.children) {
                const sortedChildren = [...container.children].sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
                sortedChildren.forEach((child: any) => traverse(child));
            }
        };

        [...layout.containers].sort((a, b) => (a.order || 0) - (b.order || 0)).forEach(c => traverse(c));

        return widgets;
    }, [loadedPages, pageId]);

    const moveSelection = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
        const widgets = getFlattenedWidgets();
        if (widgets.length === 0) return;

        let nextIndex = -1;
        const currentIndex = selectedWidgetId ? widgets.indexOf(selectedWidgetId) : -1;

        if (currentIndex === -1) {
            // Select first if nothing selected
            nextIndex = 0;
        } else {
            // Linear navigation mapping
            // Right/Down = Next
            // Left/Up = Prev
            if (direction === 'down' || direction === 'right') {
                nextIndex = currentIndex + 1;
                if (nextIndex >= widgets.length) nextIndex = widgets.length - 1; // Clamp to end
            } else {
                nextIndex = currentIndex - 1;
                if (nextIndex < 0) nextIndex = 0; // Clamp to start
            }
        }

        if (nextIndex !== -1 && nextIndex !== currentIndex) {
            const nextId = widgets[nextIndex];
            selectWidget(nextId);

            // Scroll into view
            setTimeout(() => {
                const element = document.getElementById(`widget-item-${nextId}`);
                if (element) {
                    //  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 0);
        }

    }, [selectedWidgetId, getFlattenedWidgets, selectWidget]);

    return {
        selectedWidgetId,
        selectWidget,
        clearSelection,
        moveSelection
    };
}
