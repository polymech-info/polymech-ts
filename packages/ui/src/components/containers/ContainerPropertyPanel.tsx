import React, { useState, useEffect, useCallback } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { TailwindClassPicker } from '@/components/widgets/TailwindClassPicker';
import { useLayout } from '@/modules/layout/LayoutContext';
import { LayoutContainer } from '@/modules/layout/LayoutManager';
import { Grid3X3 } from 'lucide-react';

interface ContainerPropertyPanelProps {
    pageId: string;
    selectedContainerId: string;
}

export const ContainerPropertyPanel: React.FC<ContainerPropertyPanelProps> = ({
    pageId,
    selectedContainerId,
}) => {
    const { loadedPages, updatePageContainerSettings } = useLayout();
    const layout = loadedPages.get(pageId);

    // Find the container in layout
    const findContainer = useCallback((containers: LayoutContainer[], id: string): LayoutContainer | null => {
        if (!containers) return null;
        for (const c of containers) {
            if (c.id === id) return c;
            if (c.children?.length) {
                const found = findContainer(c.children, id);
                if (found) return found;
            }
        }
        return null;
    }, []);

    const container = layout ? findContainer(layout.containers, selectedContainerId) : null;

    const [settings, setSettings] = useState<NonNullable<LayoutContainer['settings']>>({});

    // Sync settings when container changes
    useEffect(() => {
        if (container?.settings) {
            setSettings({ ...container.settings });
        } else {
            setSettings({});
        }
    }, [container?.id, container?.settings]);

    const updateSetting = useCallback(<K extends keyof NonNullable<LayoutContainer['settings']>>(
        key: K,
        value: NonNullable<LayoutContainer['settings']>[K]
    ) => {
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);
        updatePageContainerSettings(pageId, selectedContainerId, { [key]: value });
    }, [settings, pageId, selectedContainerId, updatePageContainerSettings]);

    if (!container) {
        return (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                Container not found
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto scrollbar-custom">
            <div className="p-4 space-y-4">
                {/* Header */}
                <div className="flex items-center gap-2 pb-3 border-b border-border">
                    <Grid3X3 className="h-4 w-4 text-muted-foreground" />
                    <div>
                        <h3 className="text-sm font-semibold">Container Properties</h3>
                        <p className="text-[10px] text-muted-foreground font-mono">{selectedContainerId}</p>
                    </div>
                </div>

                {/* General Properties */}
                <div className="space-y-4 pb-4 border-b border-border">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        General
                    </Label>

                    {/* Enabled Toggle */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="container-enabled" className="text-xs font-medium">Enabled</Label>
                            <p className="text-[10px] text-muted-foreground">Turn off to hide this container.</p>
                        </div>
                        <Switch
                            id="container-enabled"
                            checked={settings.enabled !== false}
                            onCheckedChange={(checked) => updateSetting('enabled', checked)}
                            className="scale-90"
                        />
                    </div>

                    {/* Columns Info */}
                    <div className="space-y-1">
                        <Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            Columns
                        </Label>
                        <p className="text-sm text-foreground">{container.columns}</p>
                    </div>

                    {/* Gap Info */}
                    <div className="space-y-1">
                        <Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            Gap
                        </Label>
                        <p className="text-sm text-foreground">{container.gap}px</p>
                    </div>
                </div>

                {/* CSS Class */}
                <div className="space-y-1 pb-4 border-b border-border">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        CSS Class
                    </Label>
                    <TailwindClassPicker
                        value={settings.customClassName || ''}
                        onChange={(newValue) => updateSetting('customClassName', newValue)}
                        placeholder={`container-${selectedContainerId.split('-').pop()}`}
                        className="w-full"
                    />
                    <p className="text-[10px] text-muted-foreground">
                        Custom CSS class applied to this container.
                    </p>
                </div>

                {/* Title Settings */}
                <div className="space-y-4 pb-4 border-b border-border">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Title
                    </Label>

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="container-show-title" className="text-xs font-medium">Show Title</Label>
                            <p className="text-[10px] text-muted-foreground">Display a title bar above the container.</p>
                        </div>
                        <Switch
                            id="container-show-title"
                            checked={settings.showTitle || false}
                            onCheckedChange={(checked) => updateSetting('showTitle', checked)}
                            className="scale-90"
                        />
                    </div>

                    {settings.showTitle && (
                        <div className="space-y-2">
                            <Label htmlFor="container-title" className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                Title Text
                            </Label>
                            <Input
                                id="container-title"
                                type="text"
                                value={settings.title || ''}
                                onChange={(e) => updateSetting('title', e.target.value)}
                                placeholder={`Container (${container.columns} col${container.columns !== 1 ? 's' : ''})`}
                                className="w-full h-8 text-sm"
                            />
                        </div>
                    )}
                </div>

                {/* Collapsible Settings */}
                <div className="space-y-4 pb-4 border-b border-border">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Behavior
                    </Label>

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="container-collapsible" className="text-xs font-medium">Collapsible</Label>
                            <p className="text-[10px] text-muted-foreground">Allow users to collapse/expand.</p>
                        </div>
                        <Switch
                            id="container-collapsible"
                            checked={settings.collapsible || false}
                            onCheckedChange={(checked) => {
                                updateSetting('collapsible', checked);
                                if (!checked) {
                                    updateSetting('collapsed', false);
                                }
                            }}
                            className="scale-90"
                        />
                    </div>

                    {settings.collapsible && (
                        <div className="flex items-center justify-between pl-4 border-l-2 border-slate-200 dark:border-slate-700">
                            <div className="space-y-0.5">
                                <Label htmlFor="container-collapsed" className="text-xs font-medium">Initially Collapsed</Label>
                                <p className="text-[10px] text-muted-foreground">Start with container collapsed.</p>
                            </div>
                            <Switch
                                id="container-collapsed"
                                checked={settings.collapsed || false}
                                onCheckedChange={(checked) => updateSetting('collapsed', checked)}
                                className="scale-90"
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
