import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { translate } from "@/i18n";
import { useLayout } from "@/modules/layout/LayoutContext";
import { useLayouts } from "@/modules/layout/useLayouts";
import { createLayout, updateLayout, deleteLayout } from "@/modules/layout/client-layouts";

type Layout = any; // TODO: replace with actual type

interface UseTemplateManagerParams {
    pageId: string | undefined;
    isOwner: boolean;
    getLoadedPageLayout: ReturnType<typeof useLayout>['getLoadedPageLayout'];
    importPageLayout: ReturnType<typeof useLayout>['importPageLayout'];
    setConfirmation: (state: React.SetStateAction<{
        open: boolean;
        title: string;
        description: string;
        onConfirm: () => void;
        confirmLabel?: string;
        variant?: "default" | "destructive";
    }>) => void;
    currentLayout: any | null;
}

export function useTemplateManager({
    pageId,
    isOwner,
    getLoadedPageLayout,
    importPageLayout,
    setConfirmation,
    currentLayout,
}: UseTemplateManagerParams) {
    const [templates, setTemplates] = useState<Layout[]>([]);
    const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
    const [showSaveTemplateDialog, setShowSaveTemplateDialog] = useState(false);
    const { getLayouts } = useLayouts();

    useEffect(() => {
        if (isOwner) {
            loadTemplates();
        }
    }, [isOwner]);

    // Sync activeTemplateId with layout state (supports Undo/Redo)
    useEffect(() => {
        if (currentLayout?.rootTemplate) {
            setActiveTemplateId(currentLayout.rootTemplate);
        }
    }, [currentLayout?.rootTemplate]);

    const loadTemplates = async () => {
        console.log("Loading templates");
        const { data } = await getLayouts({ type: 'canvas' });
        if (data) {
            setTemplates(data);
        }
    };

    const handleLoadTemplate = useCallback(async (template: Layout) => {
        if (!pageId) return;
        try {
            // Inject rootTemplate ID into the layout JSON so it persists in history
            const layoutJson = template.layout_json as any;
            const layoutWithTemplateId = {
                ...(typeof layoutJson === 'object' ? layoutJson : {}),
                rootTemplate: template.id
            };
            const layoutJsonString = JSON.stringify(layoutWithTemplateId);
            await importPageLayout(pageId, layoutJsonString);

            // Local state update is redundant due to useEffect but keeps UI snappy
            setActiveTemplateId(template.id);
            toast.success(`Loaded layout: ${template.name}`);
        } catch (e) {
            console.error("Failed to load layout", e);
            toast.error("Failed to load layout");
        }
    }, [pageId, importPageLayout]);

    const handleSaveToTemplate = useCallback(async () => {
        if (!activeTemplateId || !pageId) return;
        try {
            const layout = getLoadedPageLayout(pageId);
            if (!layout) return;
            await updateLayout(activeTemplateId, {
                layout_json: layout,
                updated_at: new Date().toISOString()
            });
            toast.success("Template updated successfully");
        } catch (e) {
            console.error("Failed to save template", e);
            toast.error("Failed to save template");
        }
    }, [activeTemplateId, pageId, getLoadedPageLayout]);

    const handleSaveAsNewTemplate = useCallback(() => {
        setShowSaveTemplateDialog(true);
    }, []);

    const onSaveTemplate = useCallback(async (name: string) => {
        if (!pageId || !name) return;
        try {
            const layout = getLoadedPageLayout(pageId);
            if (!layout) return;

            const newLayout = await createLayout({
                name,
                layout_json: layout,
                type: 'canvas',
                visibility: 'private'
            });

            toast.success("Template created successfully");
            setActiveTemplateId(newLayout.id);
            loadTemplates();
        } catch (e) {
            console.error("Failed to create template", e);
            toast.error("Failed to create template");
        }
    }, [pageId, getLoadedPageLayout]);

    const handleDeleteTemplate = useCallback((template: Layout) => {
        setConfirmation({
            open: true,
            title: translate("Delete Template"),
            description: translate("Are you sure you want to delete the template") + ` "${template.name}"?`,
            confirmLabel: translate("Delete"),
            variant: "destructive",
            onConfirm: async () => {
                try {
                    await deleteLayout(template.id);
                    toast.success(translate("Template deleted"));
                    if (activeTemplateId === template.id) {
                        setActiveTemplateId(null);
                    }
                    loadTemplates();
                } catch (e) {
                    console.error("Failed to delete template", e);
                    toast.error(translate("Failed to delete template"));
                }
                setConfirmation(prev => ({ ...prev, open: false }) as any);
            }
        });
    }, [activeTemplateId, setConfirmation]);

    const handleToggleVisibility = useCallback(async (template: Layout) => {
        try {
            const newVisibility = template.visibility === 'public' ? 'private' : 'public';
            await updateLayout(template.id, {
                visibility: newVisibility,
                updated_at: new Date().toISOString()
            });
            toast.success(translate(newVisibility === 'public' ? "Template is now public" : "Template is now private"));
            loadTemplates();
        } catch (e) {
            console.error("Failed to update template visibility", e);
            toast.error(translate("Failed to update visibility"));
        }
    }, []);

    const handleRenameTemplate = useCallback(async (template: Layout, newName: string) => {
        try {
            await updateLayout(template.id, {
                name: newName,
                updated_at: new Date().toISOString()
            });
            toast.success(translate("Template renamed"));
            loadTemplates();
        } catch (e) {
            console.error("Failed to rename template", e);
            toast.error(translate("Failed to rename template"));
        }
    }, []);

    const handleNewLayout = useCallback(() => {
        if (!pageId) return;
        setConfirmation({
            open: true,
            title: translate("Clear Layout"),
            description: translate("Are you sure you want to clear the layout?"),
            confirmLabel: translate("Clear"),
            variant: "destructive",
            onConfirm: async () => {
                try {
                    const emptyLayout = {
                        id: pageId,
                        containers: [],
                        name: 'Empty Layout',
                        createdAt: Date.now(),
                        updatedAt: Date.now()
                    };
                    const jsonString = JSON.stringify(emptyLayout);
                    await importPageLayout(pageId, jsonString);
                    setActiveTemplateId(null);
                    toast.success("Layout cleared");
                } catch (e) {
                    console.error("Failed to clear layout", e);
                    toast.error("Failed to clear layout");
                }
                setConfirmation(prev => ({ ...prev, open: false }) as any);
            }
        });
    }, [pageId, importPageLayout, setConfirmation]);

    return {
        templates,
        activeTemplateId,
        showSaveTemplateDialog,
        setShowSaveTemplateDialog,
        handleLoadTemplate,
        handleSaveToTemplate,
        handleSaveAsNewTemplate,
        onSaveTemplate,
        handleDeleteTemplate,
        handleNewLayout,
        handleToggleVisibility,
        handleRenameTemplate,
    };
}
