
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { translate } from "@/i18n";
import { useLayout } from "@/modules/layout/LayoutContext";
import { deletePage, updatePage } from "../../client-pages";
import { updateLayout } from "@/modules/layout/client-layouts";
import { MoveWidgetToTargetCommand } from "@/modules/layout/commands";
import type { DragEndEvent } from "@dnd-kit/core";
import type { Page } from "../../types";

export interface PageEditHandlersParams {
    page: Page;
    pageId: string;
    orgSlug?: string;
    userId: string;
    selectedPageId: string | null;
    selectedWidgetId: string | null;
    selectedContainerId: string | null;
    setSelectedWidgetId: (id: string | null) => void;
    setSelectedContainerId: (id: string | null) => void;
    setEditingWidgetId: (id: string | null) => void;
    setNewlyAddedWidgetId: (id: string | null) => void;
    onPageUpdate: (updatedPage: Page) => void;
}

export function usePageEditHandlers({
    page,
    pageId,
    orgSlug,
    userId,
    selectedPageId,
    selectedWidgetId,
    selectedContainerId,
    setSelectedWidgetId,
    setSelectedContainerId,
    setEditingWidgetId,
    setNewlyAddedWidgetId,
    onPageUpdate,
}: PageEditHandlersParams) {

    const {
        addWidgetToPage,
        addPageContainer,
        addFlexPageContainer,
        getLoadedPageLayout,
        loadedPages,
        executeCommand,
    } = useLayout();

    // --- Settings Dialog State ---
    const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
    const [settingsWidgetId, setSettingsWidgetId] = useState<string | null>(null);
    const [settingsLayoutId, setSettingsLayoutId] = useState<string | null>(null);
    const [selectedLayoutId, setSelectedLayoutId] = useState<string | null>(null);
    const [selectedSnippetId, setSelectedSnippetId] = useState<string | null>(null);

    // Confirmation dialog state
    const [confirmationState, setConfirmationState] = useState<{
        open: boolean;
        title: string;
        description: string;
        onConfirm: () => void;
        confirmLabel?: string;
        variant?: "default" | "destructive";
    }>({
        open: false,
        title: "",
        description: "",
        onConfirm: () => { },
    });

    // --- Settings handler ---
    const handleOpenSettings = (id: string, type: 'widget' | 'container', layoutId: string) => {
        if (type === 'widget') {
            setSettingsWidgetId(id);
            setSettingsLayoutId(layoutId);
            setSettingsDialogOpen(true);
        } else if (type === 'container') {
            setSelectedContainerId(id);
        }
    };

    const handleSelectTemplate = (template: any) => {
        setSelectedWidgetId(null);
        setSelectedContainerId(null);
        setSelectedSnippetId(null);
        setSelectedLayoutId(template.id);
    };

    const handleSelectSnippet = (snippetId: string | null) => {
        setSelectedWidgetId(null);
        setSelectedContainerId(null);
        setSelectedLayoutId(null);
        setSelectedSnippetId(snippetId);
    };

    // --- Widget handlers ---
    const handleWidgetClick = async (widgetId: string, initialProps?: Record<string, any>, snippetId?: string) => {
        await handleAddWidget(widgetId, initialProps, snippetId);
    };

    const handleAddWidget = async (widgetId: string, initialProps?: Record<string, any>, snippetId?: string) => {
        if (!page) return;
        const effectivePageId = selectedPageId || pageId;
        let targetContainerId = selectedContainerId;

        // If no container selected but a widget is, find the widget's parent container
        if (!targetContainerId && selectedWidgetId) {
            const layout = getLoadedPageLayout(effectivePageId);
            if (layout) {
                const findWidgetParent = (containers: typeof layout.containers): string | null => {
                    for (const c of containers) {
                        if (c.widgets.some(w => w.id === selectedWidgetId)) return c.id;
                        if (c.type === 'container' && c.children) {
                            const found = findWidgetParent(c.children);
                            if (found) return found;
                        }
                    }
                    return null;
                };
                targetContainerId = findWidgetParent(layout.containers);
            }
        }

        // Fallback: no selection at all — use first container or create one
        if (!targetContainerId) {
            const layout = getLoadedPageLayout(effectivePageId);
            if (layout && layout.containers.length > 0) {
                targetContainerId = layout.containers[layout.containers.length - 1].id;
            } else {
                try {
                    const newContainer = await addPageContainer(effectivePageId);
                    targetContainerId = newContainer.id;
                    setSelectedContainerId(newContainer.id);
                } catch (e) {
                    console.error("Failed to create container for widget", e);
                    return;
                }
            }
        }

        try {
            const newWidget = await addWidgetToPage(effectivePageId, targetContainerId, widgetId, undefined, undefined, initialProps);
            if (snippetId) newWidget.snippetId = snippetId;
            setEditingWidgetId(newWidget.id);
            setNewlyAddedWidgetId(newWidget.id);
            setSelectedWidgetId(newWidget.id);
        } catch (e) {
            console.error("Failed to add widget", e);
            toast.error(translate("Failed to add widget"));
        }
    };

    const handleEditWidget = (widgetId: string | null) => {
        console.trace(`[DEBUG] handleEditWidget called with: ${widgetId}`);
        if (widgetId === null) {
            setNewlyAddedWidgetId(null);
        }
        setEditingWidgetId(widgetId);
    };

    const handleAddContainer = async () => {
        if (!page) return;
        try {
            const newContainer = await addPageContainer(pageId);
            setSelectedContainerId(newContainer.id);
            toast.success(translate("Container added"));
        } catch (e) {
            console.error("Failed to add container", e);
            toast.error(translate("Failed to add container"));
        }
    };

    const handleAddFlexContainer = async () => {
        if (!page) return;
        try {
            const newContainer = await addFlexPageContainer(pageId);
            setSelectedContainerId(newContainer.id);
            toast.success(translate("Flexible container added"));
        } catch (e) {
            console.error("Failed to add flexible container", e);
            toast.error(translate("Failed to add container"));
        }
    };

    // --- Save handler ---
    const handleSave = async () => {
        console.log('[SAVE] handleSave triggered', { timestamp: Date.now(), loadedPagesKeys: [...loadedPages.keys()] });
        // Log tab widget data in parent page to check if sync-back ran
        loadedPages.forEach((layout, id) => {
            if (id.startsWith('page-')) {
                const tabWidgets = layout.containers?.flatMap((c: any) => c.widgets || []).filter((w: any) => w.widgetId === 'tabs') || [];
                tabWidgets.forEach((tw: any) => {
                    console.log(`[SAVE] TabsWidget "${tw.id}" in ${id}:`, {
                        tabCount: tw.props?.tabs?.length,
                        tabs: tw.props?.tabs?.map((t: any) => ({
                            label: t.label,
                            layoutId: t.layoutId,
                            hasLayoutData: !!t.layoutData,
                            widgetCount: t.layoutData?.containers?.reduce((sum: number, c: any) => sum + (c.widgets?.length || 0), 0) || 0,
                            layoutDataUpdatedAt: t.layoutData?.updatedAt
                        }))
                    });
                });
            } else if (id.startsWith('tab-layout-') || id.startsWith('nested-layout-')) {
                console.log(`[SAVE] SKIPPING nested layout "${id}"`, {
                    widgetCount: layout.containers?.reduce((sum: number, c: any) => sum + (c.widgets?.length || 0), 0),
                    updatedAt: layout.updatedAt
                });
            }
        });
        const toastId = toast.loading(translate("Saving..."));
        try {
            const promises: Promise<any>[] = [];

            loadedPages.forEach((layout, id) => {
                if (id.startsWith('page-')) {
                    const pId = id.replace('page-', '');
                    const rootContent = {
                        pages: { [id]: layout },
                        version: '1.0.0',
                        lastUpdated: Date.now()
                    };
                    const updatePayload: any = { content: rootContent };
                    if (pId === page.id) {
                        updatePayload.title = page.title;
                        updatePayload.slug = page.slug;
                        updatePayload.parent = page.parent;
                        updatePayload.meta = page.meta;
                    }
                    promises.push(updatePage(pId, updatePayload));
                } else if (id.startsWith('layout-')) {
                    const layoutId = id.replace('layout-', '');
                    promises.push(updateLayout(layoutId, {
                        layout_json: layout,
                        name: layout.name || `Layout ${layoutId}`,
                        type: 'component'
                    }));
                }
            });

            await Promise.all(promises);
            console.log('[SAVE] Save completed successfully', Date.now());
            toast.success(translate("Saved"), { id: toastId });
        } catch (error) {
            console.error("Failed to save all layouts", error);
            toast.error(translate("Failed to save page"), { id: toastId });
        }
    };

    // --- Delete page handler ---
    const handleDeletePage = async () => {
        if (!page) return;
        setConfirmationState({
            open: true,
            title: translate("Delete Page"),
            description: translate("Are you sure you want to delete this page?"),
            confirmLabel: translate("Delete"),
            variant: "destructive",
            onConfirm: async () => {
                try {
                    await deletePage(page.id);
                    toast.success(translate("Page deleted"));
                    const redirectUrl = orgSlug ? `/org/${orgSlug}/user/${userId}` : `/user/${userId}`;
                    window.location.href = redirectUrl;
                } catch (e) {
                    console.error("Failed to delete page", e);
                    toast.error(translate("Failed to delete page"));
                }
                setConfirmationState(prev => ({ ...prev, open: false }));
            }
        });
    };

    // --- Duplicate page handler ---
    const handleDuplicatePage = async () => {
        if (!page) return;
        setConfirmationState({
            open: true,
            title: translate("Duplicate Page"),
            description: translate("Are you sure you want to duplicate this page?"),
            confirmLabel: translate("Duplicate"),
            variant: "default",
            onConfirm: async () => {
                const toastId = toast.loading(translate("Duplicating page..."));
                try {
                    const currentLayout = getLoadedPageLayout(pageId);

                    let content: any = null;
                    if (currentLayout) {
                        content = currentLayout;
                    }

                    const newTitle = `${page.title} (Copy)`;
                    const newSlug = `${page.slug}-copy-${Math.random().toString(36).substring(2, 8)}`;

                    const { createPage } = await import('../../client-pages');
                    const newPage = await createPage({
                        title: newTitle,
                        slug: newSlug,
                        tags: page.tags || null,
                        is_public: false,
                        visible: false,
                        content: content,
                        meta: page.meta || null,
                        parent: page.parent || undefined,
                    });

                    toast.success(translate("Page duplicated"), { id: toastId });
                    const redirectUrl = orgSlug ? `/org/${orgSlug}/user/${userId}/pages/${newPage.slug}` : `/user/${userId}/pages/${newPage.slug}`;
                    window.location.href = redirectUrl;
                } catch (e) {
                    console.error("Failed to duplicate page", e);
                    toast.error(translate("Failed to duplicate page"), { id: toastId });
                }
                setConfirmationState(prev => ({ ...prev, open: false }));
            }
        });
    };

    // --- Visibility / Public toggles ---
    const handleToggleVisibility = useCallback(async () => {
        try {
            await updatePage(page.id, { visible: !page.visible });
            onPageUpdate({ ...page, visible: !page.visible });
            toast.success(translate(page.visible ? 'Page hidden' : 'Page made visible'));
        } catch (error) {
            console.error('Error toggling visibility:', error);
            toast.error(translate('Failed to update page visibility'));
        }
    }, [page, onPageUpdate]);

    const handleTogglePublic = useCallback(async () => {
        try {
            await updatePage(page.id, { is_public: !page.is_public });
            onPageUpdate({ ...page, is_public: !page.is_public });
            toast.success(translate(page.is_public ? 'Page made private' : 'Page made public'));
        } catch (error) {
            console.error('Error toggling public status:', error);
            toast.error(translate('Failed to update page status'));
        }
    }, [page, onPageUpdate]);

    // --- DnD handler ---
    const handleDragEnd = useCallback(async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;

        const src = active.data.current as any;
        const dst = over.data.current as any;
        if (!src || !dst) return;

        const effectivePageId = selectedPageId || pageId;

        // Handle existing widget moves
        if (src.type === 'existing-widget' && (dst.type === 'container-cell' || dst.type === 'flex-cell')) {
            // Don't move to same position
            if (src.sourceContainerId === dst.containerId) {
                if (dst.type === 'container-cell' && src.sourceIndex === dst.index) return;
                if (dst.type === 'flex-cell' && src.sourceRowId === dst.rowId && src.sourceColumn === dst.column) return;
            }

            const target: any = { containerId: dst.containerId };
            if (dst.type === 'flex-cell') {
                target.rowId = dst.rowId;
                target.column = dst.column;
            } else {
                target.index = dst.index;
            }

            await executeCommand(new MoveWidgetToTargetCommand(effectivePageId, src.widgetInstanceId, target));
        }

        // Handle new widget from ribbon
        if (src.type === 'new-widget' && (dst.type === 'container-cell' || dst.type === 'flex-cell')) {
            try {
                const targetColumn = dst.type === 'flex-cell' ? dst.column : undefined;
                const targetRowId = dst.type === 'flex-cell' ? dst.rowId : undefined;
                const newWidget = await addWidgetToPage(effectivePageId, dst.containerId, src.widgetId, targetColumn, targetRowId);
                setNewlyAddedWidgetId(newWidget.id);
                setSelectedWidgetId(newWidget.id);
                // Delay opening settings dialog to let DOM settle after drop
                requestAnimationFrame(() => {
                    setEditingWidgetId(newWidget.id);
                });
            } catch (e) {
                console.error('Failed to add widget via drag', e);
                toast.error(translate('Failed to add widget'));
            }
        }
    }, [executeCommand, pageId, selectedPageId, addWidgetToPage, setEditingWidgetId, setNewlyAddedWidgetId, setSelectedWidgetId]);

    return {
        // Settings dialog
        settingsDialogOpen,
        setSettingsDialogOpen,
        settingsWidgetId,
        setSettingsWidgetId,
        settingsLayoutId,
        selectedLayoutId,
        setSelectedLayoutId,
        selectedSnippetId,
        setSelectedSnippetId,

        // Confirmation dialog
        confirmationState,
        setConfirmationState,

        // Handlers
        handleOpenSettings,
        handleSelectTemplate,
        handleSelectSnippet,
        handleWidgetClick,
        handleAddWidget,
        handleEditWidget,
        handleAddContainer,
        handleAddFlexContainer,
        handleSave,
        handleDeletePage,
        handleDuplicatePage,
        handleToggleVisibility,
        handleTogglePublic,
        handleDragEnd,
    };
}
