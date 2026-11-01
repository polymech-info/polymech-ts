import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Database } from "@/integrations/supabase/types";
import { T, translate } from "@/i18n";
import { toast } from "sonner";
import { Play, Trash2, X } from "lucide-react";
import { widgetRegistry } from "@/lib/widgetRegistry";
import { WidgetPropertiesForm } from "@/components/widgets/WidgetPropertiesForm";
import type { WidgetSnippetData } from "@/modules/layout/useWidgetSnippets";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Layout = Database['public']['Tables']['layouts']['Row'];

interface SnippetPropertyPanelProps {
    snippet: Layout;
    onInsert: (widgetId: string, props?: Record<string, any>) => void;
    onDelete: (id: string) => void;
    onRename: (id: string, name: string) => void;
    onPropsUpdate: (id: string, data: WidgetSnippetData) => void;
    onClose: () => void;
}

export const SnippetPropertyPanel = ({
    snippet,
    onInsert,
    onDelete,
    onRename,
    onPropsUpdate,
    onClose,
}: SnippetPropertyPanelProps) => {
    const data = snippet.layout_json as unknown as WidgetSnippetData;
    const widgetDef = data?.widgetId ? widgetRegistry.get(data.widgetId) : null;

    const [name, setName] = useState(snippet.name);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [localProps, setLocalProps] = useState<Record<string, any>>(data?.props || {});

    useEffect(() => {
        setName(snippet.name);
        const d = snippet.layout_json as unknown as WidgetSnippetData;
        setLocalProps(d?.props || {});
    }, [snippet.id, snippet.name, snippet.layout_json]);

    const handleRename = () => {
        const trimmed = name.trim();
        if (trimmed && trimmed !== snippet.name) {
            onRename(snippet.id, trimmed);
        }
    };

    const handleSettingsChange = (newSettings: Record<string, any>) => {
        setLocalProps(newSettings);
        onPropsUpdate(snippet.id, { widgetId: data.widgetId, props: newSettings });
    };

    return (
        <div className="flex flex-col h-full bg-background">
            <div className="flex items-center justify-between px-4 py-2 border-b">
                <h3 className="text-sm font-semibold"><T>Snippet Properties</T></h3>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
                    <X className="h-3.5 w-3.5" />
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-custom">
                {/* Name Section */}
                <div className="space-y-2">
                    <Label htmlFor="snippet-name"><T>Name</T></Label>
                    <Input
                        id="snippet-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onBlur={handleRename}
                        onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                    />
                </div>

                {/* Info */}
                <div className="space-y-4 pt-4 border-t">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <span className="text-muted-foreground"><T>Widget</T></span>
                        <span className="font-medium">{widgetDef?.metadata?.name || data?.widgetId || '—'}</span>

                        <span className="text-muted-foreground"><T>Created</T></span>
                        <span className="font-medium">
                            {new Date(snippet.created_at).toLocaleDateString()}
                        </span>
                    </div>
                </div>

                {/* Widget Config Form */}
                {widgetDef?.metadata?.configSchema && (
                    <div className="pt-4 border-t">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 block">
                            <T>Widget Settings</T>
                        </Label>
                        <WidgetPropertiesForm
                            widgetDefinition={widgetDef}
                            currentProps={localProps}
                            onSettingsChange={handleSettingsChange}
                        />
                    </div>
                )}
            </div>

            {/* Actions Footer */}
            <div className="p-4 border-t bg-muted/10 space-y-3">
                <Button
                    className="w-full gap-2"
                    onClick={() => onInsert(data.widgetId, localProps)}
                >
                    <Play className="h-4 w-4" />
                    <T>Insert Widget</T>
                </Button>

                <Button
                    variant="destructive"
                    className="w-full gap-2"
                    onClick={() => setShowDeleteConfirm(true)}
                >
                    <Trash2 className="h-4 w-4" />
                    <T>Delete Snippet</T>
                </Button>
            </div>

            <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle><T>Delete Snippet</T></AlertDialogTitle>
                        <AlertDialogDescription>
                            <T>Are you sure you want to delete</T> <strong>{snippet.name}</strong>?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel><T>Cancel</T></AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => onDelete(snippet.id)}
                        >
                            <T>Delete</T>
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};
