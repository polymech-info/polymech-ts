
import React, { useState, useEffect, lazy, Suspense, useRef, useCallback, useMemo } from "react";
import type { ImperativePanelHandle } from "react-resizable-panels";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { T, translate } from "@/i18n";
import { GenericCanvas } from "@/modules/layout/GenericCanvas";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Lazy-loaded editor components
const WidgetPropertyPanel = lazy(() => import("@/components/widgets/WidgetPropertyPanel").then(module => ({ default: module.WidgetPropertyPanel })));
const SaveTemplateDialog = lazy(() => import("./SaveTemplateDialog").then(module => ({ default: module.SaveTemplateDialog })));

import MarkdownRenderer from "@/components/MarkdownRenderer";
import { MobileTOC } from "@/components/sidebar/MobileTOC";
import { MarkdownHeading } from "@/lib/toc";
import { useLayout } from "@/modules/layout/LayoutContext";
import { SelectionProvider, useSelection } from "@/modules/layout/SelectionContext";

import { UserPageDetails } from "./UserPageDetails";
import PageRibbonBar from "./ribbons/PageRibbonBar";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { updatePage } from "../client-pages";
import { PagePickerDialog } from "../PagePickerDialog";
import { CategoryManager } from "@/components/widgets/CategoryManager";
import { widgetRegistry } from "@/lib/widgetRegistry";

// Shared types
import { Page, UserProfile } from "../types";

// Extracted hooks
import { useEditorKeyboardShortcuts } from "./hooks/useEditorKeyboardShortcuts";
import { useTemplateManager } from "./hooks/useTemplateManager";
import { useEmailActions } from "./hooks/useEmailActions";
import { useClipboardActions } from "./hooks/useClipboardActions";
import { useLayoutIO } from "./hooks/useLayoutIO";
import { usePageEditHandlers } from "./hooks/usePageEditHandlers";
import { usePageEditAI } from "./hooks/usePageEditAI";

// Extracted sub-components
import { EmailPreviewPanel } from "./EmailPreviewPanel";
import { SendEmailDialog } from "./SendEmailDialog";
import { EditorRightPanel } from "./EditorRightPanel";
import { EditorLeftSidebar } from "./EditorLeftSidebar";
import { CommandPicker, useEditorCommands } from "./CommandPicker";
import { AILayoutWizard } from "./AILayoutWizard";

// Chat integration
import { ChatMessages, sidebarProps as chatSidebarProps } from "@/modules/ai/ChatPanel";
import { DndContext, DragOverlay, pointerWithin, useSensor, useSensors, PointerSensor, DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { DragPreview } from '@/modules/layout/DragPreview';

interface UserPageEditProps {
    page: Page;
    userProfile: UserProfile | null;
    isOwner: boolean;
    userId: string;
    orgSlug?: string;
    headings: MarkdownHeading[];
    childPages: { id: string; title: string; slug: string }[];
    onExitEditMode: () => void;
    onPageUpdate: (updatedPage: Page) => void;
    contextVariables?: Record<string, any>;
}

const UserPageEditInner = ({
    page,
    userProfile,
    isOwner,
    userId,
    orgSlug,
    headings,
    childPages,
    onExitEditMode,
    onPageUpdate,
    contextVariables,
}: UserPageEditProps) => {

    // --- Selection state ---
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const leftPanelRef = useRef<ImperativePanelHandle>(null);
    const { selectedWidgetIds, selectedContainerId, selectWidget, selectContainer, clearSelection, toggleWidgetSelection, hasClipboard } = useSelection();
    const selectedWidgetId = selectedWidgetIds.size > 0 ? Array.from(selectedWidgetIds)[0] : null;

    // Track modifier key state for multi-select
    const modifierKeyRef = useRef(false);
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => { if (e.ctrlKey || e.metaKey) modifierKeyRef.current = true; };
        const onKeyUp = (e: KeyboardEvent) => { if (!e.ctrlKey && !e.metaKey) modifierKeyRef.current = false; };
        const onBlur = () => { modifierKeyRef.current = false; };
        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);
        window.addEventListener('blur', onBlur);
        return () => { window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp); window.removeEventListener('blur', onBlur); };
    }, []);

    // Wrapper setters for backward compatibility
    const setSelectedWidgetId = useCallback((id: string | null) => {
        if (!id) { clearSelection(); return; }
        if (modifierKeyRef.current) { toggleWidgetSelection(id); }
        else if (selectedWidgetIds.size === 1 && selectedWidgetIds.has(id)) { clearSelection(); }
        else { selectWidget(id); }
    }, [selectWidget, toggleWidgetSelection, clearSelection, selectedWidgetIds]);

    const setSelectedContainerId = useCallback((id: string | null) => {
        if (id && selectedContainerId === id) { selectContainer(null); }
        else { selectContainer(id); }
    }, [selectContainer, selectedContainerId]);

    // --- Core state ---
    const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
    const [showHierarchy, setShowHierarchy] = useState(true);
    const [isPreview, setIsPreview] = useState(false);
    const [editingWidgetId, setEditingWidgetId] = useState<string | null>(null);
    const [newlyAddedWidgetId, setNewlyAddedWidgetId] = useState<string | null>(null);

    // --- Layout context ---
    const {
        undo,
        redo,
        canUndo,
        canRedo,
        getLoadedPageLayout,
        loadedPages,
        executeCommand,
    } = useLayout();

    const pageId = `page-${page.id}`;

    // --- Extracted handlers hook ---
    const handlers = usePageEditHandlers({
        page,
        pageId,
        orgSlug,
        userId,
        selectedPageId,
        selectedWidgetId,
        selectedContainerId,
        setSelectedWidgetId,
        setSelectedContainerId,
        setEditingWidgetId,
        setNewlyAddedWidgetId,
        onPageUpdate,
    });

    // --- Extracted AI hook ---
    const [includePageContext, setIncludePageContext] = useState(() => {
        try { return localStorage.getItem('editor-chat-page-context') === 'true'; } catch { return false; }
    });

    const ai = usePageEditAI({
        page,
        pageId,
        selectedPageId,
        selectedWidgetId,
        selectedContainerId,
        includePageContext,
    });

    // --- Extracted hooks ---
    const templateManager = useTemplateManager({
        pageId,
        isOwner,
        getLoadedPageLayout,
        importPageLayout: useLayout().importPageLayout,
        setConfirmation: handlers.setConfirmationState,
        currentLayout: loadedPages.get(pageId) || null,
    });

    const emailActions = useEmailActions({
        page: { owner: page.owner, slug: page.slug },
        orgSlug,
    });

    const clipboardActions = useClipboardActions({
        pageId,
        selectedPageId,
        selectedContainerId,
    });

    const layoutIO = useLayoutIO({
        pageId,
        pageTitle: page.title,
        onClearSelection: () => {
            setSelectedContainerId(null);
            setSelectedWidgetId(null);
        },
    });

    // --- Selection breadcrumb ---
    const selectionBreadcrumb = useMemo(() => {
        if (isPreview || (!selectedContainerId && !selectedWidgetId)) return null;
        const effectivePageId = selectedPageId || pageId;
        const layout = getLoadedPageLayout(effectivePageId);
        if (!layout) return null;
        const crumbs: string[] = [];
        const findPath = (containers: typeof layout.containers, targetCId: string | null, targetWId: string | null): boolean => {
            for (const c of containers) {
                const label = c.settings?.title || (c.type === 'container' ? `Container (${c.columns} col${c.columns !== 1 ? 's' : ''})` : 'Flexible Container');
                if (targetCId && c.id === targetCId) { crumbs.push(label); return true; }
                if (targetWId) {
                    const w = c.widgets.find(w => w.id === targetWId);
                    if (w) { crumbs.push(label); crumbs.push(widgetRegistry.get(w.widgetId)?.metadata?.name || w.widgetId); return true; }
                }
                if (c.type === 'container' && c.children) { crumbs.push(label); if (findPath(c.children, targetCId, targetWId)) return true; crumbs.pop(); }
            }
            return false;
        };
        findPath(layout.containers, selectedContainerId, selectedWidgetId);
        if (crumbs.length === 0) return null;
        return (
            <p className="text-xs text-blue-500 dark:text-blue-400 mt-1 flex items-center gap-1 flex-wrap">
                <span className="opacity-60">▸</span>
                {crumbs.map((crumb, i) => (
                    <React.Fragment key={i}>
                        {i > 0 && <span className="opacity-40">›</span>}
                        <span className={i === crumbs.length - 1 ? "font-semibold" : "opacity-75"}>{crumb}</span>
                    </React.Fragment>
                ))}
            </p>
        );
    }, [isPreview, selectedContainerId, selectedWidgetId, selectedPageId, pageId, getLoadedPageLayout]);

    // --- Auto-collapse sidebar if no TOC headings ---
    useEffect(() => {
        if (headings.length === 0) {
            setIsSidebarCollapsed(true);
        }
    }, [headings.length]);

    // --- Type fields state ---
    const getAssignedTypes = () => {
        const assignedTypesMap = new Map<string, any>();
        if (page?.category_paths) {
            page.category_paths.forEach(path => {
                path.forEach(cat => {
                    if ((cat as any).assigned_types && Array.isArray((cat as any).assigned_types)) {
                        (cat as any).assigned_types.forEach((t: any) => {
                            assignedTypesMap.set(t.id, t);
                        });
                    }
                });
            });
        }
        return Array.from(assignedTypesMap.values());
    };

    const assignedTypes = getAssignedTypes();
    const hasTypeFields = assignedTypes.length > 0;
    const [showTypeFields, setShowTypeFields] = useState(false);

    useEffect(() => {
        if (!selectedWidgetId && !selectedContainerId && !handlers.selectedLayoutId && !handlers.selectedSnippetId) {
            setShowTypeFields(true);
        } else {
            setShowTypeFields(false);
        }
    }, [selectedWidgetId, selectedContainerId, handlers.selectedLayoutId, handlers.selectedSnippetId]);

    const handleToggleTypeFields = () => {
        if (showTypeFields) {
            setShowTypeFields(false);
        } else {
            setSelectedWidgetId(null);
            setSelectedContainerId(null);
            setShowTypeFields(true);
        }
    };

    const handleSelectTemplate = (template: any) => {
        handlers.handleSelectTemplate(template);
        setShowTypeFields(false);
        setIsSidebarCollapsed(false);
    };

    const handleSelectSnippet = (snippetId: string) => {
        handlers.handleSelectSnippet(snippetId);
        setShowTypeFields(false);
    };

    // --- Command picker ---
    const [showCommandPicker, setShowCommandPicker] = useState(false);

    // --- Page management state for command picker ---
    const [showPagePicker, setShowPagePicker] = useState(false);
    const [showCategoryManager, setShowCategoryManager] = useState(false);
    const [showAIWizard, setShowAIWizard] = useState(false);

    const editorCommands = useEditorCommands({
        onUndo: undo,
        onRedo: redo,
        canUndo,
        canRedo,
        onCopy: clipboardActions.handleCopy,
        onPaste: clipboardActions.handlePaste,
        onSave: handlers.handleSave,
        onAddContainer: handlers.handleAddContainer,
        onAddFlexContainer: handlers.handleAddFlexContainer,
        onAddWidget: handlers.handleWidgetClick,
        onTogglePreview: () => setIsPreview(prev => !prev),
        onToggleHierarchy: () => {
            setShowHierarchy(prev => !prev);
            if (isSidebarCollapsed) setIsSidebarCollapsed(false);
        },
        onToggleTypeFields: handleToggleTypeFields,
        hasTypeFields,
        onExportLayout: layoutIO.handleExportLayout,
        onImportLayout: layoutIO.handleImportLayout,
        onSaveAsNewTemplate: templateManager.handleSaveAsNewTemplate,
        onNewLayout: templateManager.handleNewLayout,
        onToggleEmailPreview: () => emailActions.setShowEmailPreview(!emailActions.showEmailPreview),
        onSendEmail: () => emailActions.setShowSendEmailDialog(true),
        pageVisible: page.visible,
        pagePublic: page.is_public,
        onToggleVisibility: handlers.handleToggleVisibility,
        onTogglePublic: handlers.handleTogglePublic,
        onSelectParent: () => setShowPagePicker(true),
        onManageCategories: () => setShowCategoryManager(true),
        onAIAssistant: () => ai.setShowChat(prev => !prev),
    });

    // --- Keyboard shortcuts (extracted hook) ---
    useEditorKeyboardShortcuts({
        onSave: handlers.handleSave,
        onUndo: undo,
        onRedo: redo,
        canUndo,
        canRedo,
        onCopy: clipboardActions.handleCopy,
        onPaste: clipboardActions.handlePaste,
        onTogglePreview: () => setIsPreview(prev => !prev),
        selectedWidgetIds,
        selectedContainerId,
        onCommandPicker: () => setShowCommandPicker(true),
    });

    // --- Computed values ---
    const currentLayout = page ? getLoadedPageLayout(pageId) : null;

    // --- DnD state ---
    const [activeDragData, setActiveDragData] = useState<any>(null);
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        setActiveDragData(null);
        handlers.handleDragEnd(event);
    }, [handlers.handleDragEnd]);

    // --- Render ---
    return (
        <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragStart={(e: DragStartEvent) => setActiveDragData(e.active.data.current)} onDragEnd={handleDragEnd} onDragCancel={() => setActiveDragData(null)}>
            <div className="h-screen flex flex-col overflow-hidden">
                <PageRibbonBar
                    page={page}
                    isOwner={isOwner}
                    onToggleEditMode={() => {
                        onExitEditMode();
                        setSelectedWidgetId(null);
                        setSelectedContainerId(null);
                        setShowTypeFields(false);
                    }}
                    onPageUpdate={onPageUpdate}
                    onDelete={handlers.handleDeletePage}
                    onDuplicate={handlers.handleDuplicatePage}
                    onMetaUpdated={() => { }}
                    templates={templateManager.templates}
                    onSelectTemplate={handleSelectTemplate}
                    onDeleteTemplate={templateManager.handleDeleteTemplate}
                    onToggleVisibility={templateManager.handleToggleVisibility}
                    onToggleWidget={handlers.handleWidgetClick}
                    onAddContainer={handlers.handleAddContainer}
                    onAddFlexContainer={handlers.handleAddFlexContainer}
                    onUndo={undo}
                    onRedo={redo}
                    canUndo={canUndo}
                    canRedo={canRedo}
                    onExportLayout={layoutIO.handleExportLayout}
                    onImportLayout={layoutIO.handleImportLayout}
                    activeTemplateId={templateManager.activeTemplateId || undefined}
                    selectedLayoutId={handlers.selectedLayoutId}
                    onSaveToTemplate={templateManager.handleSaveToTemplate}
                    onSaveAsNewTemplate={templateManager.handleSaveAsNewTemplate}
                    onNewLayout={templateManager.handleNewLayout}
                    showHierarchy={showHierarchy}
                    onToggleHierarchy={() => {
                        setShowHierarchy(!showHierarchy);
                        if (isSidebarCollapsed) setIsSidebarCollapsed(false);
                    }}
                    onToggleTypeFields={handleToggleTypeFields}
                    showTypeFields={showTypeFields}
                    hasTypeFields={hasTypeFields}
                    onSave={handlers.handleSave}
                    showEmailPreview={emailActions.showEmailPreview}
                    onToggleEmailPreview={() => emailActions.setShowEmailPreview(!emailActions.showEmailPreview)}
                    onSendEmail={() => emailActions.setShowSendEmailDialog(true)}
                    isPreview={isPreview}
                    onTogglePreview={() => setIsPreview(!isPreview)}
                    selectedWidgetId={selectedWidgetId}
                    selectedWidgetIds={selectedWidgetIds}
                    selectedContainerId={selectedContainerId}
                    onCopy={clipboardActions.handleCopy}
                    onPaste={clipboardActions.handlePaste}
                    hasClipboard={hasClipboard}
                    onAIAssistant={() => ai.setShowChat(prev => !prev)}
                    onSelectSnippet={handleSelectSnippet}
                />

                <div className="flex-1 flex min-h-0">
                    <ResizablePanelGroup direction="horizontal" className="flex-1 h-full min-w-0">
                        {/* Left Sidebar */}
                        {!emailActions.showEmailPreview && (headings.length > 0 || childPages.length > 0 || showHierarchy || ai.showChat) && (
                            <>
                                <ResizablePanel
                                    ref={leftPanelRef}
                                    defaultSize={isSidebarCollapsed ? 3 : 18}
                                    minSize={3}
                                    maxSize={35}
                                    order={0}
                                    collapsible
                                    collapsedSize={3}
                                    onCollapse={() => setIsSidebarCollapsed(true)}
                                    onExpand={() => setIsSidebarCollapsed(false)}
                                >
                                    <EditorLeftSidebar
                                        isSidebarCollapsed={isSidebarCollapsed}
                                        onToggleSidebar={() => {
                                            if (isSidebarCollapsed) {
                                                leftPanelRef.current?.expand();
                                            } else {
                                                leftPanelRef.current?.collapse();
                                            }
                                        }}
                                        childPages={childPages}
                                        headings={headings}
                                        orgSlug={orgSlug}
                                        userId={userId}
                                        showHierarchy={showHierarchy}
                                        currentLayout={currentLayout}
                                        selectedWidgetId={selectedWidgetId}
                                        selectedContainerId={selectedContainerId}
                                        isPreview={isPreview}
                                        page={page}
                                        showEmailPreview={emailActions.showEmailPreview}
                                        onSelectWidget={setSelectedWidgetId}
                                        onSelectContainer={setSelectedContainerId}
                                        onOpenSettings={handlers.handleOpenSettings}
                                        setEditingWidgetId={setEditingWidgetId}
                                        setSelectedPageId={setSelectedPageId}
                                        showChat={ai.showChat}
                                        chatSidebarProps={ai.showChat ? {
                                            ...chatSidebarProps(ai.chatEngine),
                                            extraToggles: ai.chatExtraToggles,
                                        } : undefined}
                                        includePageContext={includePageContext}
                                        onTogglePageContext={() => {
                                            const next = !includePageContext;
                                            setIncludePageContext(next);
                                            try { localStorage.setItem('editor-chat-page-context', String(next)); } catch { }
                                        }}
                                    />
                                </ResizablePanel>
                                <ResizableHandle withHandle />
                            </>
                        )}

                        {/* Main Content */}
                        <ResizablePanel defaultSize={60} minSize={30} order={1}>
                            {ai.isSplitActive ? (
                                /* ── Split view: canvas top + chat bottom ── */
                                <ResizablePanelGroup direction="vertical" className="h-full">
                                    <ResizablePanel defaultSize={55} minSize={20}>
                                        <div className="h-full overflow-y-auto scrollbar-custom p-2">
                                            <GenericCanvas
                                                pageId={pageId}
                                                pageName={page.title}
                                                isEditMode={!isPreview}
                                                showControls={!isPreview}
                                                initialLayout={page.content}
                                                selectedWidgetId={isPreview ? null : selectedWidgetId}
                                                selectedWidgetIds={isPreview ? undefined : selectedWidgetIds}
                                                onSelectWidget={(id, pId) => {
                                                    if (isPreview) return;
                                                    setSelectedWidgetId(id);
                                                    setSelectedPageId(pId || pageId);
                                                }}
                                                selectedContainerId={isPreview ? null : selectedContainerId}
                                                onSelectContainer={(id, pId) => {
                                                    if (isPreview) return;
                                                    setSelectedContainerId(id);
                                                    if (id) {
                                                        setSelectedPageId(pId || pageId);
                                                    }
                                                }}
                                                editingWidgetId={isPreview ? null : editingWidgetId}
                                                onEditWidget={handlers.handleEditWidget}
                                                newlyAddedWidgetId={isPreview ? null : newlyAddedWidgetId}
                                                contextVariables={contextVariables}
                                                pageContext={{
                                                    title: page.title,
                                                    slug: page.slug,
                                                    meta: page.meta,
                                                    content: page.content,
                                                    categories: page.categories,
                                                    tags: page.tags
                                                }}
                                                onSave={handlers.handleSave}
                                                selectionBreadcrumb={selectionBreadcrumb}
                                                className="p-0"
                                            />
                                        </div>
                                    </ResizablePanel>
                                    <ResizableHandle withHandle />
                                    <ResizablePanel defaultSize={45} minSize={15}>
                                        <ChatMessages engine={ai.chatEngine} />
                                    </ResizablePanel>
                                </ResizablePanelGroup>
                            ) : (
                                <div className="h-full overflow-y-auto scrollbar-custom">
                                    <div className="container mx-auto p-4 md:p-8 max-w-5xl">
                                        {/* Mobile TOC */}
                                        {!emailActions.showEmailPreview && (
                                            <div className="lg:hidden mb-6">
                                                {headings.length > 0 && <MobileTOC headings={headings} />}
                                            </div>
                                        )}

                                        {!emailActions.showEmailPreview && (
                                            <UserPageDetails
                                                page={page}
                                                userProfile={userProfile}
                                                isOwner={isOwner}
                                                isEditMode={!isPreview}
                                                userId={userId || ''}
                                                orgSlug={orgSlug}
                                                onPageUpdate={onPageUpdate}
                                                onToggleEditMode={onExitEditMode}
                                                onWidgetRename={setSelectedWidgetId}
                                                templates={templateManager.templates}
                                                onLoadTemplate={templateManager.handleLoadTemplate}
                                                showActions={false}
                                                contextVariables={contextVariables}
                                            />
                                        )}

                                        {/* Content Body */}
                                        <div className="h-full flex flex-col dark:bg-slate-900/50 rounded-lg">
                                            {ai.showChat ? (
                                                <ChatMessages engine={ai.chatEngine} />
                                            ) : emailActions.showEmailPreview ? (
                                                <EmailPreviewPanel
                                                    page={page}
                                                    orgSlug={orgSlug}
                                                    previewMode={emailActions.previewMode}
                                                    onSetPreviewMode={emailActions.setPreviewMode}
                                                    iframeRef={emailActions.iframeRef}
                                                    authToken={emailActions.authToken}
                                                />
                                            ) : page.content && typeof page.content === 'string' ? (
                                                <div className="prose prose-lg dark:prose-invert max-w-none pb-12">
                                                    <MarkdownRenderer content={page.content} />
                                                </div>
                                            ) : (
                                                <GenericCanvas
                                                    pageId={pageId}
                                                    pageName={page.title}
                                                    isEditMode={!isPreview}
                                                    showControls={!isPreview}
                                                    initialLayout={page.content}
                                                    selectedWidgetId={isPreview ? null : selectedWidgetId}
                                                    selectedWidgetIds={isPreview ? undefined : selectedWidgetIds}
                                                    onSelectWidget={(id, pId) => {
                                                        if (isPreview) return;
                                                        setSelectedWidgetId(id);
                                                        setSelectedPageId(pId || pageId);
                                                    }}
                                                    selectedContainerId={isPreview ? null : selectedContainerId}
                                                    onSelectContainer={(id, pId) => {
                                                        if (isPreview) return;
                                                        setSelectedContainerId(id);
                                                        if (id) {
                                                            setSelectedPageId(pId || pageId);
                                                        }
                                                    }}
                                                    editingWidgetId={isPreview ? null : editingWidgetId}
                                                    onEditWidget={handlers.handleEditWidget}
                                                    newlyAddedWidgetId={isPreview ? null : newlyAddedWidgetId}
                                                    contextVariables={contextVariables}
                                                    pageContext={{
                                                        title: page.title,
                                                        slug: page.slug,
                                                        meta: page.meta,
                                                        content: page.content,
                                                        categories: page.categories,
                                                        category_paths: page.category_paths,
                                                        tags: page.tags
                                                    }}
                                                    onSave={handlers.handleSave}
                                                    selectionBreadcrumb={selectionBreadcrumb}
                                                />
                                            )}

                                            {/* Footer in Preview Mode */}
                                            {isPreview && !emailActions.showEmailPreview && (
                                                <div className="mt-8 pt-8 border-t text-sm text-muted-foreground">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <T>Last updated:</T> {new Date(page.updated_at).toLocaleDateString('en-US', {
                                                                year: 'numeric',
                                                                month: 'long',
                                                                day: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </div>
                                                        {page.parent && (
                                                            <Link
                                                                to={`/user/${page.owner}/pages/${page.parent}`}
                                                                className="text-primary hover:underline"
                                                            >
                                                                <T>View parent page</T>
                                                            </Link>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </ResizablePanel>

                        {/* Right Sidebar - Property Panel OR Type Fields */}
                        <EditorRightPanel
                            selectedWidgetId={selectedWidgetId}
                            selectedContainerId={selectedContainerId}
                            showTypeFields={showTypeFields}
                            page={page}
                            selectedPageId={selectedPageId}
                            assignedTypes={assignedTypes}
                            onPageUpdate={onPageUpdate}
                            contextVariables={contextVariables}
                            setSelectedWidgetId={setSelectedWidgetId}
                            selectedLayout={templateManager.templates?.find(t => t.id === handlers.selectedLayoutId) || null}
                            onRenameLayout={templateManager.handleRenameTemplate}
                            onDeleteLayout={templateManager.handleDeleteTemplate}
                            onApplyLayout={templateManager.handleLoadTemplate}
                            onToggleLayoutVisibility={templateManager.handleToggleVisibility}
                            selectedSnippetId={handlers.selectedSnippetId}
                            onInsertSnippet={(widgetId, props, snippetId) => {
                                handlers.handleWidgetClick(widgetId, props, snippetId);
                                handlers.setSelectedSnippetId(null);
                            }}
                            onDeleteSnippet={(id) => {
                                handlers.setSelectedSnippetId(null);
                            }}
                            onCloseSnippet={() => handlers.setSelectedSnippetId(null)}
                        />
                    </ResizablePanelGroup>
                </div>

                <Suspense fallback={null}>
                    <SaveTemplateDialog
                        isOpen={templateManager.showSaveTemplateDialog}
                        onClose={() => templateManager.setShowSaveTemplateDialog(false)}
                        onSave={templateManager.onSaveTemplate}
                    />
                </Suspense>

                {/* Widget Settings Dialog */}
                <Dialog open={handlers.settingsDialogOpen} onOpenChange={handlers.setSettingsDialogOpen}>
                    <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle><T>Widget Settings</T></DialogTitle>
                        </DialogHeader>
                        {handlers.settingsWidgetId && handlers.settingsLayoutId && (
                            <Suspense fallback={<div>Loading...</div>}>
                                <WidgetPropertyPanel
                                    pageId={handlers.settingsLayoutId}
                                    selectedWidgetId={handlers.settingsWidgetId}
                                    onWidgetRenamed={(newId) => {
                                        handlers.setSettingsWidgetId(newId);
                                        if (selectedWidgetId === handlers.settingsWidgetId) {
                                            setSelectedWidgetId(newId);
                                        }
                                    }}
                                    contextVariables={contextVariables}
                                />
                            </Suspense>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Send Email Dialog */}
                <SendEmailDialog
                    open={emailActions.showSendEmailDialog}
                    onOpenChange={emailActions.setShowSendEmailDialog}
                    emailRecipient={emailActions.emailRecipient}
                    onEmailRecipientChange={emailActions.setEmailRecipient}
                    emailSubject={emailActions.emailSubject}
                    onEmailSubjectChange={emailActions.setEmailSubject}
                    pageTitle={page.title}
                    onSend={emailActions.handleSendEmail}
                    isSending={emailActions.isSendingEmail}
                />

                <ConfirmationDialog
                    open={handlers.confirmationState.open}
                    onOpenChange={(open) => handlers.setConfirmationState(prev => ({ ...prev, open }))}
                    title={handlers.confirmationState.title}
                    description={handlers.confirmationState.description}
                    onConfirm={handlers.confirmationState.onConfirm}
                    confirmLabel={handlers.confirmationState.confirmLabel}
                    variant={handlers.confirmationState.variant}
                />

                {/* Command Picker Overlay */}
                <CommandPicker
                    open={showCommandPicker}
                    onOpenChange={setShowCommandPicker}
                    commands={editorCommands}
                />

                {/* AI Layout Wizard */}
                <AILayoutWizard
                    isOpen={showAIWizard}
                    onClose={() => setShowAIWizard(false)}
                    onContainersGenerated={async (containers) => {
                        const { BatchAddContainersCommand } = await import('@/modules/layout/commands');
                        const effectivePageId = selectedPageId || pageId;
                        await executeCommand(new BatchAddContainersCommand(effectivePageId, containers));
                        toast.success(translate(`Added ${containers.length} container(s) from AI`));
                    }}
                    contextVariables={contextVariables}
                    pageContext={{
                        title: page.title,
                        slug: page.slug,
                        meta: page.meta,
                        content: page.content,
                        categories: page.categories,
                        category_paths: page.category_paths,
                        tags: page.tags
                    }}
                />

                {/* Page Picker (from command picker) */}
                <PagePickerDialog
                    isOpen={showPagePicker}
                    onClose={() => setShowPagePicker(false)}
                    onSelect={async (selectedPage: any) => {
                        try {
                            await updatePage(page.id, { parent: selectedPage?.id ?? null });
                            const updatedPage = { ...page, parent: selectedPage?.id ?? null };
                            if (selectedPage) {
                                updatedPage.parent_page = { title: selectedPage.title, slug: selectedPage.slug };
                            } else {
                                updatedPage.parent_page = null;
                            }
                            onPageUpdate(updatedPage);
                            toast.success(translate('Page parent updated'));
                        } catch (error) {
                            console.error('Error updating parent:', error);
                            toast.error(translate('Failed to update page parent'));
                        }
                    }}
                    currentValue={page.parent}
                    forbiddenIds={[page.id]}
                />

                {/* Category Manager (from command picker) */}
                <CategoryManager
                    isOpen={showCategoryManager}
                    onClose={() => setShowCategoryManager(false)}
                    currentPageId={page.id}
                    currentPageMeta={page.meta}
                    onPageMetaUpdate={async (newMeta, newCategories) => {
                        try {
                            await updatePage(page.id, { meta: { ...page.meta, ...newMeta } });
                            const updatedPage = { ...page, meta: { ...page.meta, ...newMeta } };
                            if (newCategories) {
                                updatedPage.categories = newCategories;
                                updatedPage.category_paths = undefined;
                            }
                            onPageUpdate(updatedPage);
                        } catch (error) {
                            console.error('Failed to update categories:', error);
                            toast.error(translate('Failed to update categories'));
                        }
                    }}
                    filterByType="pages"
                    defaultMetaType="pages"
                />
            </div>
            <DragOverlay dropAnimation={null}>
                {activeDragData && <DragPreview data={activeDragData} />}
            </DragOverlay>
        </DndContext>
    );
};

const UserPageEdit = (props: UserPageEditProps) => (
    <SelectionProvider>
        <UserPageEditInner {...props} />
    </SelectionProvider>
);

export default UserPageEdit;
