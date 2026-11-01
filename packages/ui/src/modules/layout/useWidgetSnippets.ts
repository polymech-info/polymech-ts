import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { translate } from "@/i18n";
import { useLayouts } from "./useLayouts";

type Layout = any; // TODO: replace with actual type

const SNIPPET_TYPE = 'widget-snippet';

export interface WidgetSnippetData {
    widgetId: string;
    props?: Record<string, any>;
}

export function useWidgetSnippets() {
    const [snippets, setSnippets] = useState<Layout[]>([]);
    const [loading, setLoading] = useState(false);
    const { getLayouts, createLayout, updateLayout, deleteLayout } = useLayouts();

    const loadSnippets = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await getLayouts({ type: SNIPPET_TYPE });
            if (error) throw error;
            setSnippets(data || []);
        } catch (e) {
            console.error("Failed to load widget snippets", e);
        } finally {
            setLoading(false);
        }
    }, [getLayouts]);

    useEffect(() => {
        loadSnippets();
    }, []);

    const saveSnippet = useCallback(async (name: string, widgetData: WidgetSnippetData) => {
        try {
            const { data, error } = await createLayout({
                name,
                layout_json: widgetData as any,
                type: SNIPPET_TYPE,
                visibility: 'private',
                meta: { sourceWidgetType: widgetData.widgetId },
            });
            if (error) throw error;
            toast.success(translate("Widget saved"));
            await loadSnippets();
            return data;
        } catch (e) {
            console.error("Failed to save widget snippet", e);
            toast.error(translate("Failed to save widget"));
            return null;
        }
    }, [createLayout, loadSnippets]);

    const updateSnippetName = useCallback(async (id: string, name: string) => {
        try {
            const { error } = await updateLayout(id, { name });
            if (error) throw error;
            toast.success(translate("Widget renamed"));
            await loadSnippets();
        } catch (e) {
            console.error("Failed to rename widget snippet", e);
            toast.error(translate("Failed to rename widget"));
        }
    }, [updateLayout, loadSnippets]);

    const updateSnippetData = useCallback(async (id: string, widgetData: WidgetSnippetData) => {
        try {
            const { error } = await updateLayout(id, {
                layout_json: widgetData as any,
                meta: { sourceWidgetType: widgetData.widgetId },
            });
            if (error) throw error;
            toast.success(translate("Widget updated"));
            await loadSnippets();
        } catch (e) {
            console.error("Failed to update widget snippet", e);
            toast.error(translate("Failed to update widget"));
        }
    }, [updateLayout, loadSnippets]);

    const cloneSnippet = useCallback(async (snippet: Layout) => {
        const snippetData = snippet.layout_json as unknown as WidgetSnippetData;
        try {
            const { data, error } = await createLayout({
                name: `${snippet.name} (copy)`,
                layout_json: snippetData as any,
                type: SNIPPET_TYPE,
                visibility: 'private',
                meta: snippet.meta || { sourceWidgetType: snippetData?.widgetId },
            });
            if (error) throw error;
            toast.success(translate("Widget cloned"));
            await loadSnippets();
            return data;
        } catch (e) {
            console.error("Failed to clone widget snippet", e);
            toast.error(translate("Failed to clone widget"));
            return null;
        }
    }, [createLayout, loadSnippets]);

    const removeSnippet = useCallback(async (id: string) => {
        try {
            const { error } = await deleteLayout(id);
            if (error) throw error;
            toast.success(translate("Widget deleted"));
            await loadSnippets();
        } catch (e) {
            console.error("Failed to delete widget snippet", e);
            toast.error(translate("Failed to delete widget"));
        }
    }, [deleteLayout, loadSnippets]);

    return {
        snippets,
        loading,
        loadSnippets,
        saveSnippet,
        updateSnippetName,
        updateSnippetData,
        cloneSnippet,
        removeSnippet,
    };
}
