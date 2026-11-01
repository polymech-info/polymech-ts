import { useCallback } from "react";
import { toast } from "sonner";
import { translate } from "@/i18n";
import { useLayout } from "@/modules/layout/LayoutContext";
import { useSelection } from "@/modules/layout/SelectionContext";
import { PasteWidgetsCommand, PasteContainersCommand } from "@/modules/layout/commands";
import { WidgetInstance, LayoutContainer as LayoutContainerType } from "@/modules/layout/LayoutManager";

interface UseClipboardActionsParams {
    pageId: string | undefined;
    selectedPageId: string | null;
    selectedContainerId: string | null;
}

export function useClipboardActions({
    pageId,
    selectedPageId,
    selectedContainerId,
}: UseClipboardActionsParams) {
    const { getLoadedPageLayout, executeCommand } = useLayout();
    const { selectedWidgetIds, clipboard, copyToClipboard } = useSelection();

    const handleCopy = useCallback(() => {
        if (!pageId) return;
        const effectivePageId = selectedPageId || pageId;
        const layout = getLoadedPageLayout(effectivePageId);
        if (!layout) return;

        const findWidgets = (containers: LayoutContainerType[], ids: Set<string>): WidgetInstance[] => {
            const result: WidgetInstance[] = [];
            for (const c of containers) {
                for (const w of c.widgets) {
                    if (ids.has(w.id)) result.push(w);
                }
                if (c.children) result.push(...findWidgets(c.children, ids));
            }
            return result;
        };

        const findContainer = (containers: LayoutContainerType[], id: string): LayoutContainerType | null => {
            for (const c of containers) {
                if (c.id === id) return c;
                if (c.children) {
                    const found = findContainer(c.children, id);
                    if (found) return found;
                }
            }
            return null;
        };

        if (selectedWidgetIds.size > 0) {
            const widgets = findWidgets(layout.containers, selectedWidgetIds);
            if (widgets.length === 0) {
                toast.error(translate('Nothing selected to copy'));
                return;
            }
            copyToClipboard({ widgets, containers: [] });
            toast.success(translate(`Copied ${widgets.length} widget(s)`));
        } else if (selectedContainerId) {
            const container = findContainer(layout.containers, selectedContainerId);
            if (!container) {
                toast.error(translate('Container not found'));
                return;
            }
            copyToClipboard({ widgets: [], containers: [container] });
            toast.success(translate(`Copied container with ${container.widgets.length} widget(s)`));
        } else {
            toast.error(translate('Nothing selected to copy'));
        }
    }, [pageId, selectedPageId, selectedWidgetIds, selectedContainerId, getLoadedPageLayout, copyToClipboard]);

    const handlePaste = useCallback(async () => {
        if (!pageId || !clipboard) return;
        const effectivePageId = selectedPageId || pageId;
        const layout = getLoadedPageLayout(effectivePageId);
        if (!layout) return;

        try {
            if (clipboard.containers.length > 0) {
                // Find insert position: after selected container, or end
                let insertIndex = -1;
                if (selectedContainerId) {
                    const idx = layout.containers.findIndex(c => c.id === selectedContainerId);
                    if (idx !== -1) insertIndex = idx;
                }

                const cmd = new PasteContainersCommand(effectivePageId, clipboard.containers, insertIndex);
                await executeCommand(cmd);
                toast.success(translate(`Pasted ${clipboard.containers.length} container(s)`));
            } else if (clipboard.widgets.length > 0) {
                let targetContainerId = selectedContainerId;

                // If no container selected but a widget is, find the widget's parent container
                if (!targetContainerId && selectedWidgetIds.size > 0) {
                    const firstSelectedId = Array.from(selectedWidgetIds)[0];
                    const findWidgetParent = (containers: LayoutContainerType[]): string | null => {
                        for (const c of containers) {
                            if (c.widgets.some(w => w.id === firstSelectedId)) return c.id;
                            if (c.children) {
                                const found = findWidgetParent(c.children);
                                if (found) return found;
                            }
                        }
                        return null;
                    };
                    targetContainerId = findWidgetParent(layout.containers);
                }

                // Fallback: no selection — use first container
                if (!targetContainerId && layout.containers.length > 0) {
                    targetContainerId = layout.containers[layout.containers.length - 1].id;
                }
                if (!targetContainerId) {
                    toast.error(translate('No container to paste into'));
                    return;
                }
                const cmd = new PasteWidgetsCommand(effectivePageId, targetContainerId, clipboard.widgets);
                await executeCommand(cmd);
                toast.success(translate(`Pasted ${clipboard.widgets.length} widget(s)`));
            }
        } catch (e) {
            console.error('Paste failed', e);
            toast.error(translate('Failed to paste'));
        }
    }, [pageId, selectedPageId, clipboard, selectedContainerId, getLoadedPageLayout, executeCommand]);

    return { handleCopy, handlePaste };
}
