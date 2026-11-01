import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { T } from '@/i18n';
import { Settings, FileJson, LayoutTemplate, Save, ClipboardList, Mail, MoreVertical, Eye, Pencil, Trash2, FolderTree } from 'lucide-react';
import { CategoryManager } from '@/components/widgets/CategoryManager';
import { updateLayoutMeta } from '@/modules/layout/client-layouts';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Database } from '@/integrations/supabase/types';

type Layout = Database['public']['Tables']['layouts']['Row'];

interface PlaygroundHeaderProps {
    viewMode: 'design' | 'preview';
    setViewMode: (mode: 'design' | 'preview') => void;
    handleExportHtml: () => void;
    onSendTestEmail: () => void;
    htmlSize?: number;

    // Template Menu
    templates: Layout[];
    handleLoadTemplate: (template: Layout) => void;
    onSaveTemplateClick: () => void;
    handleDeleteTemplate?: (layoutId: string) => void;
    handleToggleVisibility?: (layoutId: string, currentVisibility: Database['public']['Enums']['layout_visibility']) => void;
    handleRenameLayout?: (layoutId: string, newName: string) => void;

    // Other Actions
    onPasteJsonClick: () => void;
    handleDumpJson: () => void;
    handleLoadContext: () => void;

    // Edit Mode
    isEditMode: boolean;
    setIsEditMode: (mode: boolean) => void;
}

export const PlaygroundHeader: React.FC<PlaygroundHeaderProps> = ({
    viewMode,
    setViewMode,
    handleExportHtml,
    onSendTestEmail,
    htmlSize,
    templates,
    handleLoadTemplate,
    onSaveTemplateClick,
    handleDeleteTemplate,
    handleToggleVisibility,
    handleRenameLayout,
    onPasteJsonClick,
    handleDumpJson,
    handleLoadContext,
    isEditMode,
    setIsEditMode
}) => {
    const [editingLayoutId, setEditingLayoutId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');
    const [showCategoryManager, setShowCategoryManager] = useState(false);
    const [selectedLayoutForCategories, setSelectedLayoutForCategories] = useState<Layout | null>(null);

    const getVisibilityIcon = (visibility: Database['public']['Enums']['layout_visibility']) => {
        switch (visibility) {
            case 'public': return '🌐';
            case 'listed': return '📋';
            case 'private': return '🔒';
            default: return '❓';
        }
    };

    const handleLayoutMetaUpdate = async (newMeta: any) => {
        if (!selectedLayoutForCategories) return;
        try {
            await updateLayoutMeta(selectedLayoutForCategories.id, newMeta);
            // Optionally refresh templates or update local state
        } catch (error) {
            console.error('Failed to update layout categories:', error);
        }
    };

    return (
        <div className="border-b bg-background/95 backdrop-blur z-10 shrink-0 p-4 flex flex-wrap gap-4 justify-between items-center">
            <div>
                <h1 className="text-xl font-bold">Canvas Playground</h1>
                <p className="text-sm text-muted-foreground">Experiment with widgets and layout</p>
            </div>
            <div className="flex flex-wrap gap-2 border-l pl-2 ml-2 items-center">
                <Button
                    variant={viewMode === 'design' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('design')}
                >
                    Design
                </Button>
                <Button
                    variant={viewMode === 'preview' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('preview')}
                >
                    Preview
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleExportHtml}
                    title="Export HTML"
                >
                    <Save className="h-4 w-4" />
                </Button>
            </div>

            <div className="flex flex-wrap gap-2 items-center">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2">
                            <LayoutTemplate className="h-4 w-4" />
                            <T>Layouts</T>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56">
                        <DropdownMenuLabel>Predefined Layouts</DropdownMenuLabel>
                        <DropdownMenuGroup>
                            {templates.filter(t => t.is_predefined).map((t, i) => (
                                <DropdownMenuItem key={`pre-${i}`} onClick={() => handleLoadTemplate(t)}>
                                    {t.name}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>My Layouts</DropdownMenuLabel>
                        <DropdownMenuGroup>
                            {templates.filter(t => !t.is_predefined).length === 0 && (
                                <div className="px-2 py-1.5 text-xs text-muted-foreground">No saved layouts</div>
                            )}
                            {templates.filter(t => !t.is_predefined).map((t, i) => (
                                <div key={`cust-${i}`} className="flex items-center gap-1 px-1">
                                    {editingLayoutId === t.id ? (
                                        <div className="flex items-center gap-1 flex-1 py-1">
                                            <input
                                                type="text"
                                                value={editingName}
                                                onChange={(e) => setEditingName(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        handleRenameLayout?.(t.id, editingName);
                                                        setEditingLayoutId(null);
                                                    } else if (e.key === 'Escape') {
                                                        setEditingLayoutId(null);
                                                    }
                                                }}
                                                className="flex-1 px-2 py-1 text-sm border rounded"
                                                autoFocus
                                            />
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0"
                                                onClick={() => {
                                                    handleRenameLayout?.(t.id, editingName);
                                                    setEditingLayoutId(null);
                                                }}
                                            >
                                                ✓
                                            </Button>
                                        </div>
                                    ) : (
                                        <>
                                            <DropdownMenuItem
                                                className="flex-1 cursor-pointer"
                                                onClick={() => handleLoadTemplate(t)}
                                            >
                                                <span className="mr-2">{getVisibilityIcon(t.visibility)}</span>
                                                {t.name}
                                            </DropdownMenuItem>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 w-6 p-0"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <MoreVertical className="h-3 w-3" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-40">
                                                    <DropdownMenuItem
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleToggleVisibility?.(t.id, t.visibility);
                                                        }}
                                                    >
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        <span className="text-xs">{t.visibility}</span>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setEditingLayoutId(t.id);
                                                            setEditingName(t.name);
                                                        }}
                                                    >
                                                        <Pencil className="mr-2 h-4 w-4" />
                                                        Rename
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedLayoutForCategories(t);
                                                            setShowCategoryManager(true);
                                                        }}
                                                    >
                                                        <FolderTree className="mr-2 h-4 w-4" />
                                                        Categories
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (confirm(`Delete "${t.name}"?`)) {
                                                                handleDeleteTemplate?.(t.id);
                                                            }
                                                        }}
                                                        className="text-red-600"
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </>
                                    )}
                                </div>
                            ))}
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={onSaveTemplateClick}>
                            <Save className="mr-2 h-4 w-4" />
                            <span>Save Current as Template...</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={onPasteJsonClick}
                    className="gap-2"
                >
                    <ClipboardList className="h-4 w-4" />
                    <T>Paste JSON</T>
                </Button>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDumpJson}
                    className="gap-2"
                >
                    <FileJson className="h-4 w-4" />
                    <T>Dump JSON</T>
                </Button>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLoadContext}
                    className="gap-2"
                >
                    <Mail className="h-4 w-4" />
                    <T>Load Email Context</T>
                </Button>

                {htmlSize !== undefined && (
                    <div className={`text-xs px-2 py-1 rounded border gap-1 flex items-center ${htmlSize > 102000 ? 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800' :
                        htmlSize > 80000 ? 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800' :
                            'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                        }`} title="Gmail clips HTML larger than 102KB">
                        <span className="font-mono">{(htmlSize / 1024).toFixed(1)}KB</span>
                        <span className="opacity-50">/ 102KB</span>
                    </div>
                )}

                <Button
                    variant="outline"
                    size="sm"
                    onClick={onSendTestEmail}
                    className="gap-2"
                >
                    <Mail className="h-4 w-4" />
                    <T>Send Test Email</T>
                </Button>

                <Button
                    variant={isEditMode ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setIsEditMode(!isEditMode)}
                    className="gap-2"
                >
                    <Settings className="h-4 w-4" />
                    <T>{isEditMode ? 'Disable Edit Mode' : 'Enable Edit Mode'}</T>
                </Button>
            </div>

            {/* Category Manager Dialog */}
            <CategoryManager
                isOpen={showCategoryManager}
                onClose={() => {
                    setShowCategoryManager(false);
                    setSelectedLayoutForCategories(null);
                }}
                currentPageId={selectedLayoutForCategories?.id}
                currentPageMeta={selectedLayoutForCategories?.meta}
                onPageMetaUpdate={handleLayoutMetaUpdate}
                filterByType="layout"
                defaultMetaType="layout"
            />
        </div>
    );
};
