import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Database } from "@/integrations/supabase/types";
import { T, translate } from "@/i18n";
import { toast } from "sonner";
import { Check, Trash2, Globe, Lock, Play } from "lucide-react";

type Layout = Database['public']['Tables']['layouts']['Row'];

interface LayoutPropertyPanelProps {
    layout: Layout;
    onRename: (newName: string) => Promise<void>;
    onDelete: () => void;
    onApply: () => void;
    onToggleVisibility: () => void;
    isLoading?: boolean;
}

export const LayoutPropertyPanel = ({
    layout,
    onRename,
    onDelete,
    onApply,
    onToggleVisibility,
    isLoading = false
}: LayoutPropertyPanelProps) => {
    const [name, setName] = useState(layout.name);
    const [isRenaming, setIsRenaming] = useState(false);

    useEffect(() => {
        setName(layout.name);
    }, [layout.id, layout.name]);

    const handleRename = async () => {
        if (name.trim() === layout.name) return;
        setIsRenaming(true);
        try {
            await onRename(name);
        } finally {
            setIsRenaming(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-background">
            <div className="flex items-center justify-between px-4 py-2 border-b">
                <h3 className="text-sm font-semibold"><T>Layout Properties</T></h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Name Section */}
                <div className="space-y-2">
                    <Label htmlFor="layout-name"><T>Name</T></Label>
                    <div className="flex gap-2">
                        <Input
                            id="layout-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onBlur={handleRename}
                            onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                            disabled={isLoading || isRenaming}
                        />
                    </div>
                </div>

                {/* Info Section */}
                <div className="space-y-4 pt-4 border-t">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <span className="text-muted-foreground"><T>Type</T></span>
                        <span className="font-medium">{layout.type}</span>

                        <span className="text-muted-foreground"><T>Created</T></span>
                        <span className="font-medium">
                            {new Date(layout.created_at).toLocaleDateString()}
                        </span>
                    </div>
                </div>

                {/* Visibility Section */}
                <div className="space-y-4 pt-4 border-t">
                    <Label><T>Visibility</T></Label>
                    <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                        <div className="flex items-center gap-2">
                            {layout.visibility === 'public' ? (
                                <Globe className="h-4 w-4 text-green-500" />
                            ) : (
                                <Lock className="h-4 w-4 text-amber-500" />
                            )}
                            <span className="text-sm font-medium capitalize">
                                <T>{layout.visibility}</T>
                            </span>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onToggleVisibility}
                            disabled={isLoading}
                        >
                            {layout.visibility === 'public' ? <T>Make Private</T> : <T>Make Public</T>}
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {layout.visibility === 'public'
                            ? <T>Public layouts effectively become templates that are visible to everyone.</T>
                            : <T>Private layouts are only visible to you.</T>}
                    </p>
                </div>
            </div>

            {/* Actions Footer */}
            <div className="p-4 border-t bg-muted/10 space-y-3">
                <Button
                    className="w-full gap-2"
                    onClick={onApply}
                    disabled={isLoading}
                >
                    <Play className="h-4 w-4" />
                    <T>Apply Layout</T>
                </Button>

                <Button
                    variant="destructive"
                    className="w-full gap-2"
                    onClick={onDelete}
                    disabled={isLoading}
                >
                    <Trash2 className="h-4 w-4" />
                    <T>Delete Layout</T>
                </Button>
            </div>
        </div>
    );
};
