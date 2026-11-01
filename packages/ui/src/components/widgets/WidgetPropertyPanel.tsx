import React, { useState } from 'react';
import { T, translate } from '@/i18n';
import { toast } from 'sonner';
import { WidgetInstance } from '@/modules/layout/LayoutManager';
import { widgetRegistry } from '@/lib/widgetRegistry';
import { WidgetPropertiesForm } from './WidgetPropertiesForm';
import { useLayout } from '@/modules/layout/LayoutContext';
import { useWidgetSnippets, WidgetSnippetData } from '@/modules/layout/useWidgetSnippets';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BookmarkPlus } from 'lucide-react';

interface WidgetPropertyPanelProps {
    pageId: string;
    selectedWidgetId: string | null;
    onWidgetRenamed?: (newId: string) => void;
    className?: string;
    contextVariables?: Record<string, any>;
}

const EMPTY_PROPS = {};

export const WidgetPropertyPanel: React.FC<WidgetPropertyPanelProps> = ({
    pageId,
    selectedWidgetId,
    onWidgetRenamed,
    className = '',
    contextVariables = {}
}) => {
    const { loadedPages, updateWidgetProps, renameWidget } = useLayout();
    const { saveSnippet } = useWidgetSnippets();
    const page = loadedPages.get(pageId);

    // Save as snippet state
    const [showSaveInput, setShowSaveInput] = useState(false);
    const [snippetName, setSnippetName] = useState('');
    const [saving, setSaving] = useState(false);

    // Find the selected widget instance
    const findWidget = (): WidgetInstance | null => {
        if (!page || !selectedWidgetId) return null;
        for (const container of page.containers) {
            const widget = container.widgets.find(w => w.id === selectedWidgetId);
            if (widget) return widget;
        }
        return null;
    };

    const widget = findWidget();
    const widgetDefinition = widget ? widgetRegistry.get(widget.widgetId) : null;

    if (!widget || !widgetDefinition) {
        return (
            <div className={`p-4 text-center text-slate-500 text-sm ${className}`}>
                {selectedWidgetId ? <T>Widget not found</T> : <T>Select a widget to edit properties</T>}
            </div>
        );
    }

    const handleSettingsChange = (newSettings: Record<string, any>) => {
        updateWidgetProps(pageId, widget.id, newSettings).catch(console.error);
    };

    const handleRename = async (newId: string) => {
        if (!widget) return;
        try {
            const success = await renameWidget(pageId, widget.id, newId);
            if (success) {
                toast.success('Widget renamed successfully');
                if (onWidgetRenamed) {
                    onWidgetRenamed(newId);
                }
            } else {
                toast.error('Failed to rename widget. ID might already exist.');
            }
        } catch (error) {
            console.error('Failed to rename widget:', error);
            toast.error('An error occurred while renaming widget');
        }
    };

    const handleSaveAsSnippet = async () => {
        if (!snippetName.trim() || !widget) return;
        setSaving(true);
        try {
            const data: WidgetSnippetData = {
                widgetId: widget.widgetId,
                props: { ...widget.props },
            };
            await saveSnippet(snippetName.trim(), data);
            setShowSaveInput(false);
            setSnippetName('');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className={`flex flex-col h-full min-w-0 overflow-hidden dark:bg-slate-900/50 border-l border-slate-200 dark:border-slate-800 ${className}`}>
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2">
                <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-sm truncate" title={widgetDefinition.metadata.name}>
                            {widgetDefinition.metadata.name}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            <T>Properties</T>
                        </p>
                    </div>
                    {!showSaveInput && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0"
                            title={translate("Save as Widget")}
                            onClick={() => {
                                setSnippetName(widgetDefinition.metadata.name);
                                setShowSaveInput(true);
                            }}
                        >
                            <BookmarkPlus className="h-4 w-4" />
                        </Button>
                    )}
                </div>
                {showSaveInput && (
                    <div className="flex items-center gap-1.5">
                        <Input
                            value={snippetName}
                            onChange={(e) => setSnippetName(e.target.value)}
                            placeholder={translate("Widget name...")}
                            className="h-7 text-xs"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveAsSnippet();
                                if (e.key === 'Escape') {
                                    setShowSaveInput(false);
                                    setSnippetName('');
                                }
                            }}
                        />
                        <Button
                            size="sm"
                            onClick={handleSaveAsSnippet}
                            disabled={!snippetName.trim() || saving}
                            className="h-7 text-xs shrink-0"
                        >
                            <T>Save</T>
                        </Button>
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-custom p-4">
                {widgetDefinition.metadata.configSchema ? (
                    <WidgetPropertiesForm
                        widgetDefinition={widgetDefinition}
                        currentProps={widget.props || EMPTY_PROPS}
                        onSettingsChange={handleSettingsChange}
                        widgetInstanceId={widget.id}
                        onRename={(newId) => {
                            handleRename(newId);
                        }}
                        contextVariables={contextVariables}
                        pageContext={page}
                    />
                ) : (
                    <div className="text-center text-slate-500 text-xs py-8">
                        <T>No configurable properties</T>
                    </div>
                )}
            </div>
        </div>
    );
};
