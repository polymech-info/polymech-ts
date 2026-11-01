import React, { useState, useRef, useEffect } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { useNavigate, useParams } from 'react-router-dom';
import { cn } from "@/lib/utils";
import { getAuthToken, serverUrl } from "@/lib/db";
import { toast } from "sonner";
import {
    LayoutTemplate,
    Eye,
    EyeOff,
    Trash2,
    GitMerge,
    FolderTree,
    FilePlus,
    Settings,
    Grid,
    Type,
    Image as ImageIcon,
    Component,
    MousePointer2,
    Save,
    Undo2,
    Copy,
    ClipboardPaste,
    Redo2,
    FileJson,
    Download,
    Upload,
    X,
    ListTree,
    Database,
    Mail,
    Send,
    MoreHorizontal,
    Plus,
    BookmarkCheck,
    Sparkles,
    Globe,
    Lock,
    Languages,
    Pencil,
    Columns
} from "lucide-react";
import { PageTranslationDialog } from '@/modules/i18n/PageTranslationDialog';
import { BatchPageTranslateDialog } from '@/modules/i18n/BatchPageTranslateDialog';
import type { WidgetInstance } from '@/modules/layout/LayoutManager';
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { T, translate } from "@/i18n";
import { CategoryManager } from "@/components/widgets/CategoryManager";
import { VariablesEditor } from "@/components/variables/VariablesEditor";
import { mergePageVariables } from "@/lib/page-variables";
import { widgetRegistry } from "@/lib/widgetRegistry";
import { iterateWidgets } from '@polymech/shared';
import { useWidgetSnippets, WidgetSnippetData } from '@/modules/layout/useWidgetSnippets';
import { PagePickerDialog } from "../../PagePickerDialog";
import { useLayout } from "@/modules/layout/LayoutContext";
import * as PageCommands from "@/modules/layout/commands";
import { ActionProvider } from "@/actions/ActionProvider";
import { useActions } from "@/actions/useActions";
import { UNDO_ACTION_ID, REDO_ACTION_ID, FINISH_ACTION_ID, CANCEL_ACTION_ID } from "@/actions/default-actions";
import { updatePage } from '../../client-pages';
import { Page } from "../../types";

const { UpdatePageParentCommand, UpdatePageMetaCommand } = PageCommands;

type Layout = any; // TODO: replace with actual type


// Snippets sub-component (uses hook, must be its own component)
const SnippetsRibbonGroup: React.FC<{
    onToggleWidget?: (widgetId: string, initialProps?: Record<string, any>) => void;
    onSelectSnippet?: (snippetId: string) => void;
}> = ({ onToggleWidget, onSelectSnippet }) => {
    const { snippets, loading, removeSnippet } = useWidgetSnippets();
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
    const pendingSnippet = pendingDeleteId ? snippets.find(s => s.id === pendingDeleteId) : null;

    if (loading || snippets.length === 0) return null;
    return (
        <>
            <RibbonGroup label="Snippets">
                <CompactFlowGroup
                    maxColumns={4}
                    actions={snippets.map(snippet => {
                        const data = snippet.layout_json as unknown as WidgetSnippetData;
                        const widgetDef = data?.widgetId ? widgetRegistry.get(data.widgetId) : null;
                        return {
                            id: snippet.id,
                            icon: widgetDef?.metadata.icon || BookmarkCheck,
                            label: snippet.name,
                            onClick: () => onSelectSnippet?.(snippet.id),
                            onDelete: () => setPendingDeleteId(snippet.id),
                            iconColor: "text-amber-600 dark:text-amber-400"
                        };
                    })}
                />
            </RibbonGroup>
            <AlertDialog open={!!pendingDeleteId} onOpenChange={(open) => { if (!open) setPendingDeleteId(null); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle><T>Delete Snippet</T></AlertDialogTitle>
                        <AlertDialogDescription>
                            <T>Are you sure you want to delete</T> <strong>{pendingSnippet?.name}</strong>?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setPendingDeleteId(null)}><T>Cancel</T></AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => {
                                if (pendingDeleteId) removeSnippet(pendingDeleteId);
                                setPendingDeleteId(null);
                            }}
                        >
                            <T>Delete</T>
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};


interface PageRibbonBarProps {
    page: Page;
    isOwner: boolean;
    onToggleEditMode: () => void;
    onPageUpdate: (updatedPage: Page) => void;
    onDelete?: () => void;
    onDuplicate?: () => void;
    onMetaUpdated?: () => void;
    templates?: Layout[];
    onLoadTemplate?: (template: Layout) => void;
    onToggleWidget?: (widgetId: string, initialProps?: Record<string, any>) => void;
    onAddContainer?: () => void;
    onAddFlexContainer?: () => void;
    className?: string;
    onUndo?: () => void;
    onRedo?: () => void;
    canUndo?: boolean;
    canRedo?: boolean;
    onImportLayout?: () => void;
    onExportLayout?: () => void;
    activeWidgets?: Set<string>;
    activeTemplateId?: string;
    onSaveToTemplate?: () => void;
    onSaveAsNewTemplate?: () => void;
    onNewLayout?: () => void;
    showHierarchy?: boolean;
    onToggleHierarchy?: () => void;
    onToggleTypeFields?: () => void;
    showTypeFields?: boolean;
    hasTypeFields?: boolean;
    onSave?: () => Promise<void>;
    showEmailPreview?: boolean;
    onToggleEmailPreview?: () => void;
    onSendEmail?: () => void;
    isPreview?: boolean;
    onTogglePreview?: () => void;
    onDeleteTemplate?: (template: Layout) => void;
    selectedWidgetId?: string | null;
    selectedWidgetIds?: Set<string>;
    selectedContainerId?: string | null;
    onCopy?: () => void;
    onPaste?: () => void;
    hasClipboard?: boolean;
    onAIAssistant?: () => void;
    onToggleVisibility?: (template: Layout) => void;
    onSelectTemplate?: (template: Layout) => void;
    selectedLayoutId?: string | null;
    onSelectSnippet?: (snippetId: string) => void;
}

// Ribbon UI Components
const RibbonTab = ({ active, onClick, children }: { active: boolean, onClick: () => void, children: React.ReactNode }) => (
    <button
        onClick={onClick}
        className={cn(
            "px-4 py-1 text-sm font-medium transition-all duration-200 border-t-2 border-transparent select-none",
            active
                ? "dark:bg-slate-800/50  text-primary border-t-blue-500 shadow-[0_4px_12px_-4px_rgba(0,0,0,0.1)]"
                : "text-muted-foreground hover:bg-background/40 hover:text-foreground"
        )}
    >
        {children}
    </button>
);

const RibbonGroup = ({ label, children }: { label: string, children: React.ReactNode }) => (
    <div className="flex flex-col h-full border-r border-border/40 px-2 last:border-r-0 relative group">
        <div className="flex-1 flex items-center gap-1 justify-center px-1">
            {children}
        </div>
        <div className="text-[10px] text-center text-muted-foreground/70 uppercase tracking-wider font-semibold select-none pb-1 transition-colors group-hover:text-muted-foreground">
            <T>{label}</T>
        </div>
    </div>
);



const RibbonItemSmall = ({
    icon: Icon,
    label,
    onClick,
    active,
    iconColor = "text-foreground",
    disabled = false,
    onDelete,
    dragData,
    ...props
}: {
    icon: any,
    label: string,
    onClick?: () => void,
    active?: boolean,
    iconColor?: string,
    disabled?: boolean,
    onDelete?: () => void,
    dragData?: Record<string, any>,
    [key: string]: any
}) => {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `ribbon-${dragData?.widgetId || label}`,
        data: dragData || {},
        disabled: !dragData,
    });

    return (
        <div className="relative group/btn w-full" ref={dragData ? setNodeRef : undefined} {...(dragData ? listeners : {})} {...(dragData ? attributes : {})}>
            <button
                onClick={onClick}
                disabled={disabled}
                {...props}
                className={cn(
                    "flex items-center gap-2 px-2 py-0.5 h-7 w-full text-left rounded-sm transition-colors text-xs font-medium",
                    !disabled && "hover:bg-accent/60",
                    active && "bg-blue-100/40 dark:bg-blue-900/10 text-blue-700 dark:text-blue-300",
                    disabled && "opacity-50 cursor-not-allowed",
                    isDragging && "opacity-30",
                    dragData && !disabled && "cursor-grab active:cursor-grabbing"
                )}
            >
                <Icon className={cn("h-4 w-4 transition-colors", iconColor)} />
                <span className="truncate pr-4"><T>{label}</T></span>
            </button>
            {onDelete && !disabled && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                    }}
                    className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 rounded-sm opacity-0 group-hover/btn:opacity-100 hover:bg-red-100 text-muted-foreground hover:text-red-500 transition-all"
                    title="Delete"
                >
                    <Trash2 className="h-3.5 w-3.5" />
                </button>
            )}
        </div>
    );
};

interface CompactAction {
    id?: string;
    icon: any;
    label: string;
    onClick?: () => void;
    active?: boolean;
    disabled?: boolean;
    iconColor?: string;
    onDelete?: () => void;
    testId?: string;
    dragData?: Record<string, any>;
}

const CompactFlowGroup = ({
    actions,
    maxColumns = 3
}: {
    actions: CompactAction[],
    maxColumns?: number
}) => {
    // Determine how many items to show based on maxColumns * 3 rows
    // If exact fit or less, show all. If more, show (maxColumns*3 - 1) and a More button
    const maxItems = maxColumns * 3;
    const shouldOverflow = actions.length > maxItems;
    const visibleCount = shouldOverflow ? maxItems - 1 : actions.length;

    const visibleActions = actions.slice(0, visibleCount);
    const overflowActions = actions.slice(visibleCount);

    return (
        <div className={cn("grid grid-rows-3 grid-flow-col gap-1")}>
            {visibleActions.map((action, i) => (
                <RibbonItemSmall
                    key={action.id || i}
                    icon={action.icon}
                    label={action.label}
                    onClick={action.onClick}
                    active={action.active}
                    disabled={action.disabled}
                    iconColor={action.iconColor}
                    onDelete={action.onDelete}
                    dragData={action.dragData}
                    {...(action.testId ? { 'data-testid': action.testId } : {})}
                />
            ))}
            {shouldOverflow && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            className={cn(
                                "flex items-center gap-2 px-2 py-0.5 h-7 w-full text-left rounded-sm transition-colors text-xs font-medium group/btn hover:bg-accent/60"
                            )}
                        >
                            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                            <span className="truncate"><T>More</T></span>
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                        {overflowActions.map((action, i) => (
                            <DropdownMenuItem
                                key={action.id || i}
                                onClick={action.onClick}
                                disabled={action.disabled}
                            >
                                <action.icon className={cn("mr-2 h-4 w-4", action.iconColor)} />
                                <span><T>{action.label}</T></span>
                                {action.onDelete && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            action.onDelete?.();
                                        }}
                                        className="ml-auto p-1 hover:text-red-500"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </button>
                                )}
                            </DropdownMenuItem>

                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </div>
    );
};


export const PageRibbonBar = ({
    page,
    isOwner,
    onToggleEditMode,
    onPageUpdate,
    onDelete,
    onDuplicate,
    onMetaUpdated,
    templates,
    onLoadTemplate,
    onToggleWidget,
    onAddContainer,
    onAddFlexContainer,
    className,
    onUndo,
    onRedo,
    canUndo = false,
    canRedo = false,
    onImportLayout,
    onExportLayout,
    activeTemplateId,
    onSaveToTemplate,
    onSaveAsNewTemplate,
    onNewLayout,
    activeWidgets = new Set(),
    showHierarchy,
    onToggleHierarchy,
    onToggleTypeFields,
    showTypeFields,
    hasTypeFields,
    onSave,
    showEmailPreview,
    onToggleEmailPreview,
    onSendEmail,
    isPreview,
    onTogglePreview,
    selectedWidgetId,
    selectedWidgetIds,
    selectedContainerId,
    onDeleteTemplate,
    onCopy,
    onPaste,
    hasClipboard = false,
    onAIAssistant,
    onToggleVisibility,
    onSelectTemplate,
    selectedLayoutId,
    onSelectSnippet
}: PageRibbonBarProps) => {
    const { executeCommand, loadPageLayout, clearHistory, getLoadedPageLayout } = useLayout();
    const navigate = useNavigate();
    const handleOpenTypes = React.useCallback(() => {
        navigate('/types-editor');
    }, [navigate]);

    const [activeTab, setActiveTab] = useState<'page' | 'widgets' | 'layouts' | 'view' | 'advanced' | 'i18n'>('page');
    const [showTranslationDialog, setShowTranslationDialog] = useState(false);
    const [showBatchTranslateDialog, setShowBatchTranslateDialog] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(false);
    const [showCategoryManager, setShowCategoryManager] = useState(false);
    const [showVariablesDialog, setShowVariablesDialog] = useState(false);
    const [showPagePicker, setShowPagePicker] = useState(false);
    const [showCreationWizard, setShowCreationWizard] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);

    // Email Size Logic
    const [emailSize, setEmailSize] = useState<number | null>(null);
    const [loadingSize, setLoadingSize] = useState(false);

    const { updateAction, getActionsByGroup } = useActions();

    // Logic duplicated from PageActions
    const baseUrl = serverUrl;

    useEffect(() => {
        if (activeTab === 'advanced') {
        }
    }, [activeTab, selectedContainerId, selectedWidgetId]);

    useEffect(() => {
        if (activeTab === 'advanced') {
            const fetchSize = async () => {
                setLoadingSize(true);
                try {
                    const token = await getAuthToken();
                    // Note: This endpoint must match the iframe preview endpoint
                    const endpoint = `${baseUrl}/user/${page.owner}/pages/${page.slug}/email-preview`;

                    const res = await fetch(endpoint, {
                        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                    });

                    if (res.ok) {
                        const blob = await res.blob();
                        setEmailSize(blob.size);
                    }
                } catch (e) {
                    console.error("Failed to fetch email size", e);
                } finally {
                    setLoadingSize(false);
                }
            };
            fetchSize();
        }
    }, [activeTab, page.owner, page.slug, baseUrl]);

    const handleParentUpdate = React.useCallback(async (newParentPage: any | null) => {
        if (loading) return;
        setLoading(true);

        // Construct old/new parent details for Undo/Redo
        const oldParent = {
            id: page.parent,
            title: page.parent_page?.title,
            slug: page.parent_page?.slug
        };

        const newParent = newParentPage ? {
            id: newParentPage.id,
            title: newParentPage.title,
            slug: newParentPage.slug
        } : null;

        try {
            await executeCommand(new UpdatePageParentCommand(
                page.id,
                oldParent,
                newParent,
                async (parentDetails) => {
                    // Callback for UI updates (executed on do and undo)
                    const updatedPage = { ...page, parent: parentDetails?.id ?? null };

                    // Optimistically update parent_page object for UI
                    if (parentDetails && parentDetails.title && parentDetails.slug) {
                        updatedPage.parent_page = {
                            title: parentDetails.title,
                            slug: parentDetails.slug
                        };
                    } else {
                        updatedPage.parent_page = null;
                    }

                    onPageUpdate(updatedPage);
                }
            ));

            toast.success(translate('Page parent updated'));
        } catch (error) {
            console.error('Error updating page parent:', error);
            toast.error(translate('Failed to update page parent'));
        } finally {
            setLoading(false);
        }
    }, [loading, page, executeCommand, onPageUpdate]);

    const handleFinish = React.useCallback(async () => {
        if (loading) return;
        setLoading(true);
        try {
            if (onSave) {
                await onSave();
                toast.success(translate('Page saved'));
            }
            onToggleEditMode();
        } catch (e) {
            console.error(e);
            toast.error(translate('Failed to save'));
        } finally {
            setLoading(false);
        }
    }, [loading, onSave, onToggleEditMode]);

    const performCancel = React.useCallback(async () => {
        try {
            setLoading(true);
            await loadPageLayout(page.id); // Revert to server state
            clearHistory(); // Clear undo stack
            onToggleEditMode(); // Exit edit mode
            toast.info(translate('Changes discarded'));
        } catch (error) {
            console.error("Failed to discard changes", error);
            toast.error(translate('Error discarding changes'));
        } finally {
            setLoading(false);
            setShowCancelDialog(false);
        }
    }, [page.id, loadPageLayout, clearHistory, onToggleEditMode]);

    const handleCancel = React.useCallback(() => {
        if (!canUndo) {
            // No changes to discard, just exit
            onToggleEditMode();
            return;
        }
        setShowCancelDialog(true);
    }, [canUndo, onToggleEditMode]);

    const handleToggleVisibility = React.useCallback(async (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (loading) return;
        setLoading(true);

        try {
            await updatePage(page.id, { visible: !page.visible });
            onPageUpdate({ ...page, visible: !page.visible });
            toast.success(translate(page.visible ? 'Page hidden' : 'Page made visible'));
        } catch (error) {
            console.error('Error toggling visibility:', error);
            toast.error(translate('Failed to update page visibility'));
        } finally {
            setLoading(false);
        }
    }, [loading, page, onPageUpdate]);

    const handleTogglePublic = React.useCallback(async (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (loading) return;
        setLoading(true);

        try {
            await updatePage(page.id, { is_public: !page.is_public });

            onPageUpdate({ ...page, is_public: !page.is_public });
            toast.success(translate(page.is_public ? 'Page made private' : 'Page made public'));
        } catch (error) {
            console.error('Error toggling public status:', error);
            toast.error(translate('Failed to update page status'));
        } finally {
            setLoading(false);
        }
    }, [loading, page, onPageUpdate]);

    const handleDumpJson = React.useCallback(async () => {
        try {
            const pageId = `page-${page.id}`;
            const currentLayout = getLoadedPageLayout(pageId);

            // Clone page to include latest content
            const pageDump = { ...page };

            if (currentLayout) {
                const rootContent = {
                    pages: { [pageId]: currentLayout },
                    version: '1.0.0',
                    lastUpdated: Date.now()
                };
                pageDump.content = rootContent as any;
            }

            const pageJson = JSON.stringify(pageDump, null, 2);
            console.log('Page JSON:', pageJson);
            await navigator.clipboard.writeText(pageJson);
            toast.success(translate("Page JSON dumped to console and clipboard"));
        } catch (e) {
            console.error("Failed to dump JSON", e);
            toast.error(translate("Failed to dump JSON"));
        }
    }, [page, getLoadedPageLayout]);

    // Sync actions with props
    React.useEffect(() => {
        if (onUndo) updateAction(UNDO_ACTION_ID, { handler: onUndo, disabled: !canUndo });
        if (onRedo) updateAction(REDO_ACTION_ID, { handler: onRedo, disabled: !canRedo });
        updateAction(FINISH_ACTION_ID, { handler: handleFinish });
        updateAction(CANCEL_ACTION_ID, { handler: handleCancel });
    }, [onUndo, onRedo, canUndo, canRedo, updateAction, handleFinish, handleCancel]);

    const historyActions = getActionsByGroup('History').filter(a => a.visibilities?.Ribbon);
    const exitActions = getActionsByGroup('Exit').filter(a => a.visibilities?.Ribbon);

    if (!isOwner) return null;

    return (
        <ActionProvider>
            <div className={cn("flex flex-col w-full border-b shadow-sm sticky top-0 z-50", className)}>
                {/* Context & Tabs Row */}
                <div className="flex items-center border-b bg-muted/90 backdrop-blur-sm">
                    <div className="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-xs font-bold tracking-widest shadow-sm">
                        <T>DESIGN</T>
                    </div>
                    <div className="flex-1 flex overflow-x-auto scrollbar-none pl-2">
                        <RibbonTab active={activeTab === 'page'} onClick={() => setActiveTab('page')}><T>PAGE</T></RibbonTab>
                        <RibbonTab active={activeTab === 'widgets'} onClick={() => setActiveTab('widgets')}><T>WIDGETS</T></RibbonTab>
                        <RibbonTab active={activeTab === 'layouts'} onClick={() => setActiveTab('layouts')}><T>LAYOUTS</T></RibbonTab>
                        <RibbonTab active={activeTab === 'view'} onClick={() => setActiveTab('view')}><T>VIEW</T></RibbonTab>
                        <RibbonTab active={activeTab === 'advanced'} onClick={() => setActiveTab('advanced')}><T>ADVANCED</T></RibbonTab>
                        <RibbonTab active={activeTab === 'i18n'} onClick={() => setActiveTab('i18n')}><T>I18N</T></RibbonTab>
                    </div>
                </div>

                {/* Ribbon Toolbar Area */}
                <div className="h-32 flex items-center  backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-inner px-0">

                    {/* Fixed 'Finish' Section - Always Visible */}
                    <div className="flex-none flex h-full items-center border-r border-border/40 bg-background/50 z-10 px-1">
                        <RibbonGroup label="Main">
                            <div className="grid grid-rows-3 grid-flow-col gap-1">
                                {exitActions.map(action => (
                                    <RibbonItemSmall
                                        key={action.id}
                                        icon={action.icon}
                                        label={action.label}
                                        onClick={() => action.handler && action.handler()}
                                        active={action.id === FINISH_ACTION_ID} // Finish is active in original
                                        iconColor={action.id === FINISH_ACTION_ID ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}
                                    />
                                ))}
                                <RibbonItemSmall
                                    icon={Save}
                                    label="Update"
                                    onClick={async () => {
                                        setLoading(true);
                                        try {
                                            if (onSave) {
                                                await onSave();
                                                toast.success(translate('Page saved'));
                                            }
                                        } catch (e) {
                                            console.error(e);
                                            toast.error(translate('Failed to save'));
                                        } finally {
                                            setLoading(false);
                                        }
                                    }}
                                    iconColor="text-blue-600 dark:text-blue-400"
                                />
                                <RibbonItemSmall
                                    icon={page.visible ? Eye : EyeOff}
                                    label={isPreview ? "Edit" : "Preview"}
                                    onClick={onTogglePreview}
                                    active={isPreview}
                                    iconColor={isPreview ? "text-green-500" : "text-blue-500"}
                                />
                                <RibbonItemSmall
                                    icon={ListTree}
                                    label="Hierarchy"
                                    onClick={onToggleHierarchy}
                                    active={showHierarchy}
                                    iconColor="text-indigo-500"
                                />
                                <RibbonItemSmall
                                    icon={Sparkles}
                                    label="AI Layout"
                                    onClick={onAIAssistant}
                                    iconColor="text-amber-500 dark:text-amber-400"
                                />
                            </div>
                        </RibbonGroup>
                        <RibbonGroup label="History">
                            <CompactFlowGroup
                                maxColumns={2}
                                actions={historyActions.map(action => ({
                                    id: action.id,
                                    icon: action.icon,
                                    label: action.label,
                                    onClick: () => action.handler && action.handler(),
                                    disabled: action.disabled,
                                    iconColor: "text-purple-600 dark:text-purple-400"
                                }))}
                            />
                        </RibbonGroup>

                        <RibbonGroup label="Clipboard">
                            <CompactFlowGroup
                                maxColumns={2}
                                actions={[
                                    {
                                        icon: Copy,
                                        label: 'Copy',
                                        onClick: onCopy,
                                        disabled: !selectedWidgetId && !selectedContainerId,
                                        active: !!selectedWidgetId || !!selectedContainerId,
                                        iconColor: 'text-blue-600 dark:text-blue-400'
                                    },
                                    {
                                        icon: ClipboardPaste,
                                        label: 'Paste',
                                        onClick: onPaste,
                                        disabled: !hasClipboard,
                                        iconColor: 'text-green-600 dark:text-green-400'
                                    }
                                ]}
                            />
                        </RibbonGroup>

                        {/* Fields Toggle */}
                        <RibbonGroup label="Data">
                            <CompactFlowGroup
                                maxColumns={2}
                                actions={[
                                    {
                                        icon: Database,
                                        label: "Fields",
                                        onClick: onToggleTypeFields,
                                        active: showTypeFields,
                                        disabled: !hasTypeFields,
                                        iconColor: "text-teal-600 dark:text-teal-400"
                                    },
                                    {
                                        icon: Database,
                                        label: "Variables",
                                        onClick: () => setShowVariablesDialog(true),
                                        iconColor: "text-indigo-600 dark:text-indigo-400"
                                    }
                                ]}
                            />
                        </RibbonGroup>
                    </div>

                    {/* Scrollable Content Section */}
                    <div
                        ref={scrollContainerRef}
                        onWheel={(e) => {
                            if (scrollContainerRef.current) {
                                scrollContainerRef.current.scrollLeft += e.deltaY;
                            }
                        }}
                        className="flex-1 flex items-center h-full overflow-x-auto overflow-y-hidden scrollbar-custom px-2"
                    >
                        {/* === PAGE TAB === */}
                        {activeTab === 'page' && (
                            <>
                                <RibbonGroup label="Manage">
                                    <CompactFlowGroup
                                        maxColumns={3}
                                        actions={[
                                            {
                                                icon: page.visible ? Eye : EyeOff,
                                                label: page.visible ? "Visible" : "Hidden",
                                                active: !page.visible,
                                                onClick: () => handleToggleVisibility(),
                                                iconColor: page.visible ? "text-emerald-500" : "text-gray-400",
                                                testId: 'page-visibility-toggle'
                                            },
                                            {
                                                icon: page.is_public ? GitMerge : Settings,
                                                label: page.is_public ? "Public" : "Private",
                                                active: !page.is_public,
                                                onClick: () => handleTogglePublic(),
                                                iconColor: page.is_public ? "text-amber-500" : "text-gray-400",
                                                testId: 'page-public-toggle'
                                            },
                                            {
                                                icon: FolderTree,
                                                label: "Categories",
                                                onClick: () => setShowCategoryManager(true),
                                                iconColor: "text-yellow-600 dark:text-yellow-400"
                                            },
                                            {
                                                icon: GitMerge,
                                                label: "Parent",
                                                onClick: () => setShowPagePicker(true),
                                                iconColor: "text-orange-500 dark:text-orange-400"
                                            },
                                            {
                                                icon: FilePlus,
                                                label: "Add Child",
                                                onClick: () => navigate(`/user/${page.owner}/pages/new?parent=${page.id}`),
                                                iconColor: "text-green-600 dark:text-green-500"
                                            },
                                            {
                                                icon: Copy,
                                                label: "Duplicate",
                                                onClick: onDuplicate,
                                                iconColor: "text-blue-500"
                                            }
                                        ]}
                                    />
                                </RibbonGroup>

                                <RibbonGroup label="Actions">
                                    <CompactFlowGroup
                                        maxColumns={2}
                                        actions={[
                                            {
                                                icon: Plus,
                                                label: "New",
                                                onClick: () => {
                                                    navigate(`/user/${page.owner}/pages/new?parent=${page.id}`);
                                                },
                                                iconColor: "text-green-600 dark:text-green-400"
                                            },
                                            ...(onDelete ? [{
                                                icon: Trash2,
                                                label: "Delete",
                                                onClick: onDelete,
                                                active: true,
                                                iconColor: "text-red-500 hover:text-red-600"
                                            }] : [])
                                        ]}
                                    />
                                </RibbonGroup>



                                <RibbonGroup label="File">
                                    <CompactFlowGroup
                                        maxColumns={2}
                                        actions={[
                                            {
                                                icon: Upload,
                                                label: "Import",
                                                onClick: onImportLayout,
                                                iconColor: "text-blue-500"
                                            },
                                            {
                                                icon: Download,
                                                label: "Export",
                                                onClick: onExportLayout,
                                                iconColor: "text-blue-500"
                                            }
                                        ]}
                                    />
                                </RibbonGroup>
                            </>
                        )}

                        {/* === WIDGETS TAB === */}
                        {activeTab === 'widgets' && (() => {
                            const allWidgets = widgetRegistry.getAll()
                                .filter(w => w.metadata.category !== 'hidden')
                                .sort((a, b) => a.metadata.name.localeCompare(b.metadata.name));

                            const structureWidgets = allWidgets.filter(w =>
                                w.metadata.tags?.some(t => ['layout', 'container', 'structure'].includes(t))
                            );

                            const mediaWidgets = allWidgets.filter(w =>
                                !structureWidgets.includes(w) &&
                                w.metadata.tags?.some(t => ['photo', 'gallery', 'image', 'video'].includes(t))
                            );

                            const contentWidgets = allWidgets.filter(w =>
                                !structureWidgets.includes(w) &&
                                !mediaWidgets.includes(w) &&
                                (w.metadata.category === 'display' || w.metadata.tags?.some(t => ['text', 'page', 'card', 'content'].includes(t)))
                            );

                            const advancedWidgets = allWidgets.filter(w =>
                                !structureWidgets.includes(w) &&
                                !mediaWidgets.includes(w) &&
                                !contentWidgets.includes(w)
                            );

                            return (
                                <>
                                    <RibbonGroup label="Structure">
                                        <CompactFlowGroup
                                            maxColumns={4}
                                            actions={[
                                                {
                                                    icon: Grid,
                                                    label: "Container",
                                                    onClick: onAddContainer,
                                                    iconColor: "text-cyan-500"
                                                },
                                                {
                                                    icon: Columns,
                                                    label: "Flex Container",
                                                    onClick: onAddFlexContainer,
                                                    iconColor: "text-purple-500"
                                                },
                                                ...structureWidgets.map(widget => ({
                                                    id: widget.metadata.id,
                                                    icon: widget.metadata.icon,
                                                    label: widget.metadata.name,
                                                    onClick: () => onToggleWidget?.(widget.metadata.id),
                                                    active: activeWidgets.has(widget.metadata.id),
                                                    iconColor: activeWidgets.has(widget.metadata.id) ? "text-green-600 dark:text-green-400" : "text-blue-600 dark:text-blue-400",
                                                    dragData: { type: 'new-widget', widgetId: widget.metadata.id, label: widget.metadata.name },
                                                }))
                                            ]}
                                        />
                                    </RibbonGroup>

                                    {mediaWidgets.length > 0 && (
                                        <RibbonGroup label="Media">
                                            <CompactFlowGroup
                                                maxColumns={4}
                                                actions={mediaWidgets.map(widget => ({
                                                    id: widget.metadata.id,
                                                    icon: widget.metadata.icon,
                                                    label: widget.metadata.name,
                                                    onClick: () => onToggleWidget?.(widget.metadata.id),
                                                    active: activeWidgets.has(widget.metadata.id),
                                                    iconColor: activeWidgets.has(widget.metadata.id) ? "text-green-600 dark:text-green-400" : "text-blue-600 dark:text-blue-400",
                                                    dragData: { type: 'new-widget', widgetId: widget.metadata.id, label: widget.metadata.name },
                                                }))}
                                            />
                                        </RibbonGroup>
                                    )}

                                    {contentWidgets.length > 0 && (
                                        <RibbonGroup label="Content">
                                            <CompactFlowGroup
                                                maxColumns={4}
                                                actions={contentWidgets.map(widget => ({
                                                    id: widget.metadata.id,
                                                    icon: widget.metadata.icon,
                                                    label: widget.metadata.name,
                                                    onClick: () => onToggleWidget?.(widget.metadata.id),
                                                    active: activeWidgets.has(widget.metadata.id),
                                                    iconColor: activeWidgets.has(widget.metadata.id) ? "text-green-600 dark:text-green-400" : "text-blue-600 dark:text-blue-400",
                                                    dragData: { type: 'new-widget', widgetId: widget.metadata.id, label: widget.metadata.name },
                                                }))}
                                            />
                                        </RibbonGroup>
                                    )}

                                    <SnippetsRibbonGroup onToggleWidget={onToggleWidget} onSelectSnippet={onSelectSnippet} />

                                    {advancedWidgets.length > 0 && (
                                        <RibbonGroup label="Advanced">
                                            <CompactFlowGroup
                                                maxColumns={4}
                                                actions={advancedWidgets.map(widget => ({
                                                    id: widget.metadata.id,
                                                    icon: widget.metadata.icon,
                                                    label: widget.metadata.name,
                                                    onClick: () => onToggleWidget?.(widget.metadata.id),
                                                    active: activeWidgets.has(widget.metadata.id),
                                                    iconColor: activeWidgets.has(widget.metadata.id) ? "text-green-600 dark:text-green-400" : "text-blue-600 dark:text-blue-400",
                                                    dragData: { type: 'new-widget', widgetId: widget.metadata.id, label: widget.metadata.name },
                                                }))}
                                            />
                                        </RibbonGroup>
                                    )}
                                </>
                            );
                        })()}

                        {/* === LAYOUTS TAB === */}
                        {activeTab === 'layouts' && (
                            <>
                                <RibbonGroup label="Actions">
                                    <CompactFlowGroup
                                        maxColumns={2}
                                        actions={[
                                            {
                                                icon: FilePlus,
                                                label: "New Layout",
                                                onClick: onNewLayout,
                                                iconColor: "text-green-500"
                                            },
                                            ...(onSaveAsNewTemplate ? [{
                                                icon: Save,
                                                label: "Save as New",
                                                onClick: onSaveAsNewTemplate,
                                                iconColor: "text-blue-500"
                                            }] : []),
                                            ...(activeTemplateId && onSaveToTemplate ? [{
                                                icon: Save,
                                                label: "Update Layout",
                                                onClick: onSaveToTemplate,
                                                iconColor: "text-pink-600 dark:text-pink-400"
                                            }] : [])
                                        ]}
                                    />
                                </RibbonGroup>

                                <RibbonGroup label="Templates">
                                    <CompactFlowGroup
                                        maxColumns={4}
                                        actions={templates?.map(t => ({
                                            id: t.id,
                                            icon: LayoutTemplate,
                                            label: t.name,
                                            onClick: () => onSelectTemplate?.(t),
                                            active: selectedLayoutId === t.id,
                                            iconColor: activeTemplateId === t.id ? "text-green-600" : "text-gray-500"
                                        })) || []}
                                    />
                                    {(!templates || templates.length === 0) && (
                                        <div className="text-xs text-muted-foreground px-2 italic"><T>No Templates</T></div>
                                    )}
                                </RibbonGroup>
                            </>
                        )}

                        {/* === VIEW TAB === */}
                        {activeTab === 'view' && (
                            <>
                                <RibbonGroup label="Panels">
                                    <CompactFlowGroup
                                        maxColumns={1}
                                        actions={[
                                            {
                                                icon: ListTree,
                                                label: "Hierarchy",
                                                onClick: onToggleHierarchy,
                                                active: showHierarchy,
                                                iconColor: "text-indigo-500"
                                            }
                                        ]}
                                    />

                                </RibbonGroup>
                            </>
                        )}

                        {/* === ADVANCED TAB === */}
                        {activeTab === 'advanced' && (
                            <>
                                <RibbonGroup label="Developer">
                                    <CompactFlowGroup
                                        maxColumns={2}
                                        actions={[
                                            {
                                                icon: Type,
                                                label: "Types",
                                                onClick: handleOpenTypes,
                                                iconColor: "text-indigo-600 dark:text-indigo-400"
                                            },
                                            {
                                                icon: FileJson,
                                                label: "Dump JSON",
                                                onClick: handleDumpJson,
                                                iconColor: "text-orange-600 dark:text-orange-400"
                                            }
                                        ]}
                                    />
                                </RibbonGroup>

                                <RibbonGroup label="Email">
                                    <div className="flex flex-col justify-center items-center px-3 gap-0.5 h-full min-w-[4rem]">
                                        <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Est. Size</div>
                                        <div className={cn(
                                            "text-sm font-bold tabular-nums",
                                            emailSize && emailSize > 102 * 1024 ? "text-red-500" : "text-green-600"
                                        )}>
                                            {loadingSize ? "..." : emailSize ? `${(emailSize / 1024).toFixed(1)} KB` : "-"}
                                        </div>
                                        <div className="text-[9px] text-muted-foreground/60">Limit: 102KB</div>
                                    </div>
                                    <CompactFlowGroup
                                        maxColumns={2}
                                        actions={[
                                            {
                                                icon: Mail,
                                                label: "Preview",
                                                onClick: onToggleEmailPreview,
                                                active: showEmailPreview,
                                                iconColor: "text-purple-600 dark:text-purple-400"
                                            },
                                            {
                                                icon: Send,
                                                label: "Send",
                                                onClick: onSendEmail,
                                                iconColor: "text-teal-600 dark:text-teal-400"
                                            }
                                        ]}
                                    />
                                </RibbonGroup>

                                <RibbonGroup label="Selection">
                                    <div className="flex flex-col justify-center px-3 gap-0.5 h-full min-w-[6rem]">
                                        <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                                            Selected
                                        </div>
                                        <div className="text-xs font-mono text-foreground/80">
                                            {selectedContainerId ? (
                                                <div title={selectedContainerId}>C: {selectedContainerId.slice(0, 8)}...</div>
                                            ) : <div className="text-muted-foreground/50">No Container</div>}
                                            {selectedWidgetId ? (
                                                <div title={selectedWidgetId}>W: {selectedWidgetId.slice(0, 8)}...{(selectedWidgetIds?.size ?? 0) > 1 ? ` +${(selectedWidgetIds?.size ?? 1) - 1}` : ''}</div>
                                            ) : <div className="text-muted-foreground/50">No Widget</div>}
                                        </div>
                                        <div className="text-[9px] text-muted-foreground/60">
                                            Count: {(selectedContainerId ? 1 : 0) + (selectedWidgetIds?.size ?? (selectedWidgetId ? 1 : 0))}
                                        </div>
                                    </div>
                                </RibbonGroup>
                            </>
                        )}

                        {/* === I18N TAB === */}
                        {activeTab === 'i18n' && (() => {
                            // Find the selected widget instance by traversing containers
                            const pageLayout = getLoadedPageLayout(`page-${page.id}`);
                            let selectedWidget: WidgetInstance | null = null;
                            if (pageLayout && selectedWidgetId) {
                                iterateWidgets(pageLayout as any, (w) => {
                                    if (w.id === selectedWidgetId) { selectedWidget = w as WidgetInstance; }
                                });
                            }

                            const isTranslatable = selectedWidget && (
                                selectedWidget.widgetId === 'markdown-text' ||
                                selectedWidget.widgetId === 'html-block'
                            );
                            const widgetContent = selectedWidget?.props?.content || '';
                            const widgetName = selectedWidget ? widgetRegistry.get(selectedWidget.widgetId)?.metadata.name || selectedWidget.widgetId : null;

                            return (
                                <>
                                    <RibbonGroup label="Selected Widget">
                                        <div className="flex flex-col justify-center px-3 gap-0.5 h-full min-w-[8rem]">
                                            {selectedWidget ? (
                                                <>
                                                    <div className="text-xs font-medium">{widgetName}</div>
                                                    <div className="text-[10px] font-mono text-muted-foreground">{selectedWidgetId?.slice(0, 12)}…</div>
                                                    {isTranslatable ? (
                                                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium"><T>Translatable</T></span>
                                                    ) : (
                                                        <span className="text-[10px] text-amber-600 dark:text-amber-400"><T>Not translatable</T></span>
                                                    )}
                                                </>
                                            ) : (
                                                <div className="text-xs text-muted-foreground italic"><T>No widget selected</T></div>
                                            )}
                                        </div>
                                    </RibbonGroup>

                                    <RibbonGroup label="Translate">
                                        <CompactFlowGroup
                                            maxColumns={2}
                                            actions={[
                                                {
                                                    icon: Languages,
                                                    label: 'Translate',
                                                    onClick: () => setShowTranslationDialog(true),
                                                    disabled: !isTranslatable || !widgetContent,
                                                    iconColor: 'text-blue-600 dark:text-blue-400',
                                                },
                                                {
                                                    icon: Pencil,
                                                    label: 'Edit Translations',
                                                    onClick: () => setShowTranslationDialog(true),
                                                    disabled: !selectedWidget,
                                                    iconColor: 'text-purple-600 dark:text-purple-400',
                                                },
                                            ]}
                                        />
                                    </RibbonGroup>

                                    <RibbonGroup label="Page">
                                        <CompactFlowGroup
                                            maxColumns={1}
                                            actions={[
                                                {
                                                    icon: Globe,
                                                    label: 'All Page Translations',
                                                    onClick: () => {
                                                        setShowBatchTranslateDialog(true);
                                                    },
                                                    iconColor: 'text-green-600 dark:text-green-400',
                                                },
                                            ]}
                                        />
                                    </RibbonGroup>
                                </>
                            );
                        })()}
                    </div>

                </div>



                {/* Managed Dialogs */}
                <Dialog open={showVariablesDialog} onOpenChange={setShowVariablesDialog}>
                    <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0">
                        <DialogHeader className="p-6 pb-2">
                            <DialogTitle><T>Page Variables</T></DialogTitle>
                        </DialogHeader>
                        <div className="flex-1 p-4 min-h-0">
                            <VariablesEditor
                                onLoad={async () => {
                                    return page.meta?.variables || {};
                                }}
                                inheritedData={mergePageVariables({ ...page, meta: { ...(page.meta || {}), variables: {} } }, {})}
                                onSave={async (newVariables) => {
                                    const pageId = `page-${page.id}`;
                                    // Use command for undo support
                                    try {
                                        await executeCommand(new UpdatePageMetaCommand(
                                            pageId,
                                            { variables: page.meta?.variables || {} },
                                            { variables: newVariables },
                                            (meta) => {
                                                // Optimistic update
                                                const updatedPage = { ...page, meta: { ...page.meta, ...meta } };
                                                onPageUpdate(updatedPage);
                                                if (onMetaUpdated) onMetaUpdated();
                                            }
                                        ));
                                        // Toast is handled by VariablesEditor, but command might not throw immediately if optimistic.
                                        // The executeCommand is awaited so it should be fine.
                                    } catch (error) {
                                        console.error("Failed to update variables", error);
                                        // Re-throw so VariablesEditor knows it failed
                                        throw error;
                                    }
                                }}
                            />
                        </div>
                    </DialogContent>
                </Dialog>

                <CategoryManager
                    isOpen={showCategoryManager}
                    onClose={() => setShowCategoryManager(false)}
                    currentPageId={page.id}
                    currentPageMeta={page.meta}

                    onPageMetaUpdate={async (newMeta, newCategories) => {
                        // Use UpdatePageMetaCommand for undo/redo support
                        const pageId = `page-${page.id}`;

                        // Construct old meta from current page.meta
                        // We only need keys present in newMeta
                        const oldMeta: Record<string, any> = {};
                        Object.keys(newMeta).forEach(key => {
                            oldMeta[key] = page.meta?.[key] ?? null;
                        });

                        try {
                            await executeCommand(new UpdatePageMetaCommand(
                                pageId,
                                { meta: oldMeta },
                                { meta: newMeta },
                                (meta) => {
                                    // Update local state for immediate feedback
                                    // Note: LayoutContext also updates its pendingMetadata
                                    // The command callback receives the payload we passed ({ meta: newMeta })
                                    // We need to extract the inner meta for local state update if needed, 
                                    // but onPageUpdate expects the full page object.
                                    // Since we wrapped it, 'meta' here is { meta: { ... } }
                                    // So we need to access meta.meta
                                    if (meta.meta) {
                                        const updatedPage = { ...page, meta: { ...page.meta, ...meta.meta } };

                                        // If we have resolved categories, update the page categories to show valid data immediately
                                        // We also clear category_paths to force fallback to 'categories' in UserPageDetails
                                        if (newCategories) {
                                            updatedPage.categories = newCategories;
                                            updatedPage.category_paths = undefined;
                                        }

                                        onPageUpdate(updatedPage);
                                    }
                                    if (onMetaUpdated) onMetaUpdated();
                                }
                            ));
                        } catch (error) {
                            console.error('Failed to update page meta:', error);
                            toast.error(translate('Failed to update categories'));
                        }
                    }}
                    filterByType="pages"
                    defaultMetaType="pages"
                />

                <PagePickerDialog
                    isOpen={showPagePicker}
                    onClose={() => setShowPagePicker(false)}
                    onSelect={handleParentUpdate}
                    currentValue={page.parent}
                    forbiddenIds={[page.id]}
                />

                {showTranslationDialog && (() => {
                    // Find selected widget once for all props
                    const pageLayout = getLoadedPageLayout(`page-${page.id}`);
                    let selectedWidget: WidgetInstance | null = null;
                    if (pageLayout && selectedWidgetId) {
                        iterateWidgets(pageLayout as any, (w) => {
                            if (w.id === selectedWidgetId) { selectedWidget = w as WidgetInstance; }
                        });
                    }
                    return (
                        <PageTranslationDialog
                            open={showTranslationDialog}
                            onOpenChange={setShowTranslationDialog}
                            pageId={page.id}
                            pageTitle={page.title}
                            widgetInstanceId={selectedWidgetId}
                            widgetTypeId={selectedWidget?.widgetId}
                            sourceContent={selectedWidget?.props?.content}
                        />
                    );
                })()}

                {showBatchTranslateDialog && (() => {
                    const pageLayout = getLoadedPageLayout(`page-${page.id}`);
                    return (
                        <BatchPageTranslateDialog
                            open={showBatchTranslateDialog}
                            onOpenChange={setShowBatchTranslateDialog}
                            pageId={page.id}
                            pageTitle={page.title}
                            pageLayout={pageLayout}
                        />
                    );
                })()}


                <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>{translate('Discard changes?')}</AlertDialogTitle>
                            <AlertDialogDescription>
                                {translate('You have unsaved changes. Are you sure you want to discard them and exit?')}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>{translate('Keep Editing')}</AlertDialogCancel>
                            <AlertDialogAction onClick={performCancel} className="bg-red-600 hover:bg-red-700">
                                {translate('Discard & Exit')}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </ActionProvider >
    );
};

export default PageRibbonBar;
