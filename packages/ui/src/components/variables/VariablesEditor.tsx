import React, { useEffect, useState, useCallback } from 'react';
import { VariableBuilder } from './VariableBuilder';
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { translate } from '@/i18n';

const STORAGE_KEY = 'variables-editor-playground';

const SYSTEM_VARIABLE_SCHEMA: Record<string, { label: string, description?: string }> = {
    showAuthor: { label: translate("Show Author"), description: translate("Toggle the display of the author name.") },
    showDate: { label: translate("Show Date"), description: translate("Toggle the display of the publish date.") },
    showCategories: { label: translate("Show Categories"), description: translate("Toggle the display of the category paths.") },
    showActions: { label: translate("Show Actions"), description: translate("Toggle the display of the top-right page actions menu.") },
    showParent: { label: translate("Show Parent Path"), description: translate("Toggle the display of the parent page path above the title.") },
    showTitle: { label: translate("Show Title"), description: translate("Toggle the display of the page title block.") },
    showToc: { label: translate("Show Table of Contents"), description: translate("Toggle the display of the side table of contents.") },
    showLastUpdated: { label: translate("Show Last Updated"), description: translate("Toggle the display of the last updated footer.") },
    showFooter: { label: translate("Show Global Footer"), description: translate("Toggle the display of the global app footer site-wide.") },
};

const defaultOnLoad = async (): Promise<Record<string, any>> => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : {};
    } catch { return {}; }
};

const defaultOnSave = async (data: Record<string, any>): Promise<void> => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export interface VariablesEditorProps {
    onLoad?: () => Promise<Record<string, any>>;
    onSave?: (data: Record<string, any>) => Promise<void>;
    inheritedData?: Record<string, any>;
    variableSchema?: Record<string, { label: string, description?: string }>;
}

export const VariablesEditor: React.FC<VariablesEditorProps> = ({
    onLoad = defaultOnLoad,
    onSave = defaultOnSave,
    inheritedData = {},
    variableSchema
}) => {
    const [variables, setVariables] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const loadVariables = useCallback(async () => {
        setLoading(true);
        try {
            const data = await onLoad();
            setVariables(data || {});
        } catch (error) {
            console.error("Failed to fetch variables", error);
            toast.error(translate("Failed to load variables"));
        } finally {
            setLoading(false);
        }
    }, [onLoad]);

    useEffect(() => {
        loadVariables();
    }, [loadVariables]);

    const handleSave = async (builderVariables: Record<string, any>) => {
        setSaving(true);
        try {
            await onSave(builderVariables);
            setVariables(builderVariables);
            toast.success(translate("Variables saved successfully"));
        } catch (error) {
            console.error("Failed to save variables", error);
            toast.error(translate("Failed to save variables"));
        } finally {
            setSaving(false);
        }
    };

    const mergedSchema = React.useMemo(() => ({ ...SYSTEM_VARIABLE_SCHEMA, ...variableSchema }), [variableSchema]);

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="h-[600px] flex flex-col gap-4">
            <div className="flex-1 min-h-0">
                <VariableBuilder
                    initialData={variables}
                    inheritedData={inheritedData}
                    onSave={handleSave}
                    isSaving={saving}
                    variableSchema={mergedSchema}
                />
            </div>
        </div>
    );
};
