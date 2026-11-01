import React, { useMemo, useState, useCallback } from 'react';
import {
    CommandDialog,
    CommandInput,
    CommandList,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandShortcut,
} from '@/components/ui/command';
import { useSelection } from '@/modules/layout/SelectionContext';
import {
    Undo2, Redo2, Copy, ClipboardPaste, Trash2,
    Grid, Eye, EyeOff, ListTree, Database, Columns,
    Save, Download, Upload, LayoutTemplate, FilePlus,
    Mail, Send, GitMerge, FolderTree, Settings, Sparkles
} from 'lucide-react';


const RECENT_COMMANDS_KEY = 'editor-recent-commands';
const MAX_RECENT = 5;

function getRecentIds(): string[] {
    try {
        const stored = localStorage.getItem(RECENT_COMMANDS_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch { return []; }
}

function pushRecentId(id: string) {
    const recent = getRecentIds().filter(r => r !== id);
    recent.unshift(id);
    localStorage.setItem(RECENT_COMMANDS_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
}

export interface CommandPickerCommand {
    id: string;
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
    group: string;
    shortcut?: string;
    disabled?: boolean;
    handler: () => void;
}

export interface CommandPickerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    commands: CommandPickerCommand[];
}

export const CommandPicker: React.FC<CommandPickerProps> = ({
    open,
    onOpenChange,
    commands,
}) => {
    const [recentIds, setRecentIds] = useState<string[]>(getRecentIds);

    // Build recent commands list from current commands
    const recentCommands = useMemo(() => {
        return recentIds
            .map(id => commands.find(c => c.id === id))
            .filter((c): c is CommandPickerCommand => !!c);
    }, [recentIds, commands]);

    // Group remaining commands
    const groups = useMemo(() => {
        const map = new Map<string, CommandPickerCommand[]>();
        for (const cmd of commands) {
            const list = map.get(cmd.group) || [];
            list.push(cmd);
            map.set(cmd.group, list);
        }
        return map;
    }, [commands]);

    const handleSelect = useCallback((commandId: string) => {
        const cmd = commands.find(c => c.id === commandId);
        if (cmd && !cmd.disabled) {
            pushRecentId(cmd.id);
            setRecentIds(getRecentIds());
            onOpenChange(false);
            requestAnimationFrame(() => cmd.handler());
        }
    }, [commands, onOpenChange]);

    return (
        <CommandDialog open={open} onOpenChange={onOpenChange}>
            <CommandInput placeholder="Type a command..." />
            <CommandList>
                <CommandEmpty>No commands found.</CommandEmpty>

                {/* Recent group always first */}
                {recentCommands.length > 0 && (
                    <CommandGroup heading="Recent">
                        {recentCommands.map(cmd => (
                            <CommandItem
                                key={`recent:${cmd.id}`}
                                value={`recent:${cmd.id}`}
                                keywords={[cmd.label, cmd.group]}
                                onSelect={() => handleSelect(cmd.id)}
                                disabled={cmd.disabled}
                                className="gap-2"
                            >
                                {cmd.icon && <cmd.icon className="h-4 w-4 shrink-0 opacity-70" />}
                                <span>{cmd.label}</span>
                                {cmd.shortcut && (
                                    <CommandShortcut>{cmd.shortcut}</CommandShortcut>
                                )}
                            </CommandItem>
                        ))}
                    </CommandGroup>
                )}

                {Array.from(groups.entries()).map(([group, cmds]) => (
                    <CommandGroup key={group} heading={group}>
                        {cmds.map(cmd => (
                            <CommandItem
                                key={cmd.id}
                                value={cmd.id}
                                onSelect={handleSelect}
                                disabled={cmd.disabled}
                                className="gap-2"
                            >
                                {cmd.icon && <cmd.icon className="h-4 w-4 shrink-0 opacity-70" />}
                                <span>{cmd.label}</span>
                                {cmd.shortcut && (
                                    <CommandShortcut>{cmd.shortcut}</CommandShortcut>
                                )}
                            </CommandItem>
                        ))}
                    </CommandGroup>
                ))}
            </CommandList>
        </CommandDialog>
    );
};

// ── Hook to build the static command list with context-aware enable/disable ──

import { widgetRegistry } from '@/lib/widgetRegistry';
import { useWidgetSnippets, WidgetSnippetData } from '@/modules/layout/useWidgetSnippets';
import { BookmarkCheck, Component } from 'lucide-react';

interface UseEditorCommandsParams {
    onUndo: () => void;
    onRedo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    onCopy: () => void;
    onPaste: () => void;
    onSave: () => void;
    onAddContainer: () => void;
    onAddFlexContainer?: () => void;
    onAddWidget: (widgetId: string, initialProps?: Record<string, any>) => void;
    onTogglePreview: () => void;
    onToggleHierarchy: () => void;
    onToggleTypeFields?: () => void;
    hasTypeFields?: boolean;
    onExportLayout: () => void;
    onImportLayout: () => void;
    onSaveAsNewTemplate?: () => void;
    onNewLayout?: () => void;
    onToggleEmailPreview?: () => void;
    onSendEmail?: () => void;
    onDeleteWidget?: () => void;
    // Page management
    pageVisible?: boolean;
    pagePublic?: boolean;
    onToggleVisibility?: () => void;
    onTogglePublic?: () => void;
    onSelectParent?: () => void;
    onManageCategories?: () => void;
    onAIAssistant?: () => void;
}

export function useEditorCommands(params: UseEditorCommandsParams): CommandPickerCommand[] {
    const { selectedWidgetIds, selectedContainerId, hasClipboard } = useSelection();
    const hasSelection = selectedWidgetIds.size > 0 || !!selectedContainerId;
    const hasWidgetSelection = selectedWidgetIds.size > 0;
    const { snippets } = useWidgetSnippets();

    return useMemo(() => {
        const commands: CommandPickerCommand[] = [
            // ── Edit ──
            { id: 'edit:undo', label: 'Undo', icon: Undo2, group: 'Edit', shortcut: 'Ctrl+Z', disabled: !params.canUndo, handler: params.onUndo },
            { id: 'edit:redo', label: 'Redo', icon: Redo2, group: 'Edit', shortcut: 'Ctrl+Y', disabled: !params.canRedo, handler: params.onRedo },
            { id: 'edit:copy', label: 'Copy', icon: Copy, group: 'Edit', shortcut: 'Ctrl+C', disabled: !hasSelection, handler: params.onCopy },
            { id: 'edit:paste', label: 'Paste', icon: ClipboardPaste, group: 'Edit', shortcut: 'Ctrl+V', disabled: !hasClipboard, handler: params.onPaste },

            // ── Insert ──
            { id: 'insert:container', label: 'Add Container', icon: Grid, group: 'Insert', handler: params.onAddContainer },
            ...(params.onAddFlexContainer ? [{ id: 'insert:flex-container', label: 'Add Flexible Container', icon: Columns, group: 'Insert', handler: params.onAddFlexContainer }] : []),
            ...(params.onDeleteWidget ? [{ id: 'insert:delete', label: 'Delete Widget', icon: Trash2, group: 'Insert', disabled: !hasWidgetSelection, handler: params.onDeleteWidget }] : []),

            // ── View ──
            { id: 'view:preview', label: 'Toggle Preview', icon: Eye, group: 'View', shortcut: 'Ctrl+Shift+V', handler: params.onTogglePreview },
            { id: 'view:hierarchy', label: 'Toggle Hierarchy', icon: ListTree, group: 'View', handler: params.onToggleHierarchy },
            ...(params.onToggleTypeFields ? [{ id: 'view:fields', label: 'Toggle Fields', icon: Database, group: 'View', disabled: !params.hasTypeFields, handler: params.onToggleTypeFields }] : []),

            // ── File ──
            { id: 'file:save', label: 'Save', icon: Save, group: 'File', shortcut: 'Ctrl+S', handler: params.onSave },
            { id: 'file:export', label: 'Export Layout', icon: Download, group: 'File', handler: params.onExportLayout },
            { id: 'file:import', label: 'Import Layout', icon: Upload, group: 'File', handler: params.onImportLayout },

            // ── Layout ──
            ...(params.onNewLayout ? [{ id: 'layout:new', label: 'New Layout', icon: FilePlus, group: 'Layout', handler: params.onNewLayout }] : []),
            ...(params.onSaveAsNewTemplate ? [{ id: 'layout:save-as', label: 'Save as Template', icon: LayoutTemplate, group: 'Layout', handler: params.onSaveAsNewTemplate }] : []),

            // ── Email ──
            ...(params.onToggleEmailPreview ? [{ id: 'email:preview', label: 'Email Preview', icon: Mail, group: 'Email', handler: params.onToggleEmailPreview }] : []),
            ...(params.onSendEmail ? [{ id: 'email:send', label: 'Send Email', icon: Send, group: 'Email', handler: params.onSendEmail }] : []),

            // ── Page ──
            ...(params.onToggleVisibility ? [{ id: 'page:visibility', label: params.pageVisible ? 'Hide Page' : 'Show Page', icon: params.pageVisible ? EyeOff : Eye, group: 'Page', handler: params.onToggleVisibility }] : []),
            ...(params.onTogglePublic ? [{ id: 'page:public', label: params.pagePublic ? 'Make Private' : 'Make Public', icon: params.pagePublic ? Settings : GitMerge, group: 'Page', handler: params.onTogglePublic }] : []),
            ...(params.onSelectParent ? [{ id: 'page:parent', label: 'Select Parent', icon: FolderTree, group: 'Page', handler: params.onSelectParent }] : []),
            ...(params.onManageCategories ? [{ id: 'page:categories', label: 'Manage Categories', icon: FolderTree, group: 'Page', handler: params.onManageCategories }] : []),

            // ── AI ──
            ...(params.onAIAssistant ? [{ id: 'ai:assistant', label: 'AI Layout Assistant', icon: Sparkles, group: 'AI', handler: params.onAIAssistant }] : []),
        ];

        // ── Add Widgets (from registry) ──
        const allWidgets = widgetRegistry.getAll()
            .filter(w => w.metadata.category !== 'hidden')
            .sort((a, b) => a.metadata.name.localeCompare(b.metadata.name));

        for (const widget of allWidgets) {
            commands.push({
                id: `add-widget:${widget.metadata.id}`,
                label: `Add ${widget.metadata.name}`,
                icon: widget.metadata.icon || Component,
                group: 'Add Widget',
                handler: () => params.onAddWidget(widget.metadata.id),
            });
        }

        // ── Snippets ──
        for (const snippet of snippets) {
            const data = snippet.layout_json as unknown as WidgetSnippetData;
            if (!data?.widgetId) continue;
            const widgetDef = widgetRegistry.get(data.widgetId);
            commands.push({
                id: `snippet:${snippet.id}`,
                label: snippet.name,
                icon: widgetDef?.metadata.icon || BookmarkCheck,
                group: 'Snippets',
                handler: () => params.onAddWidget(data.widgetId, data.props),
            });
        }

        return commands;
    }, [
        params.canUndo, params.canRedo, hasSelection, hasWidgetSelection, hasClipboard,
        params.onUndo, params.onRedo, params.onCopy, params.onPaste,
        params.onAddContainer, params.onAddFlexContainer, params.onAddWidget, params.onDeleteWidget,
        params.onTogglePreview, params.onToggleHierarchy, params.onToggleTypeFields, params.hasTypeFields,
        params.onSave, params.onExportLayout, params.onImportLayout,
        params.onSaveAsNewTemplate, params.onNewLayout,
        params.onToggleEmailPreview, params.onSendEmail,
        params.pageVisible, params.pagePublic,
        params.onToggleVisibility, params.onTogglePublic, params.onSelectParent, params.onManageCategories,
        params.onAIAssistant, snippets,
    ]);
}

