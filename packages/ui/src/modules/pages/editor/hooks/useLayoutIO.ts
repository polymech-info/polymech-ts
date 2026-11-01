import { useCallback } from "react";
import { toast } from "sonner";
import { useLayout } from "@/modules/layout/LayoutContext";

interface UseLayoutIOParams {
    pageId: string | undefined;
    pageTitle: string;
    onClearSelection: () => void;
}

export function useLayoutIO({ pageId, pageTitle, onClearSelection }: UseLayoutIOParams) {
    const { exportPageLayout, importPageLayout } = useLayout();

    const handleExportLayout = useCallback(async () => {
        if (!pageId) return;
        try {
            const jsonData = await exportPageLayout(pageId);
            const blob = new Blob([jsonData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${pageTitle.toLowerCase().replace(/\s+/g, '-')}-layout.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to export layout:', error);
            toast.error("Failed to export layout");
        }
    }, [pageId, pageTitle, exportPageLayout]);

    const handleImportLayout = useCallback(() => {
        if (!pageId) return;
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = async (e) => {
                    try {
                        const jsonData = e.target?.result as string;
                        await importPageLayout(pageId, jsonData);
                        onClearSelection();
                        toast.success("Layout imported successfully");
                    } catch (error) {
                        console.error('Failed to import layout:', error);
                        toast.error('Failed to import layout. Please check the file format.');
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }, [pageId, importPageLayout, onClearSelection]);

    return { handleExportLayout, handleImportLayout };
}
