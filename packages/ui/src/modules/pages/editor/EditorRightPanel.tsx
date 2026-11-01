import { lazy, Suspense } from "react";
import { ResizableHandle, ResizablePanel } from "@/components/ui/resizable";
import { Page } from "../types";
import { useWidgetSnippets, WidgetSnippetData } from "@/modules/layout/useWidgetSnippets";

const WidgetPropertyPanel = lazy(() => import("@/components/widgets/WidgetPropertyPanel").then(module => ({ default: module.WidgetPropertyPanel })));
const ContainerPropertyPanel = lazy(() => import("@/components/containers/ContainerPropertyPanel").then(module => ({ default: module.ContainerPropertyPanel })));
const UserPageTypeFields = lazy(() => import("./UserPageTypeFields").then(module => ({ default: module.UserPageTypeFields })));
import { LayoutPropertyPanel } from "@/components/layouts/LayoutPropertyPanel";
import { SnippetPropertyPanel } from "@/components/layouts/SnippetPropertyPanel";

interface EditorRightPanelProps {
    selectedWidgetId: string | null;
    selectedContainerId: string | null;
    showTypeFields: boolean;
    page: Page;
    selectedPageId: string | null;
    assignedTypes: any[];
    onPageUpdate: (updatedPage: Page) => void;
    contextVariables?: Record<string, any>;
    setSelectedWidgetId: (id: string | null) => void;
    selectedLayout: any | null;
    onRenameLayout: (template: any, newName: string) => Promise<void>;
    onDeleteLayout: (template: any) => void;
    onApplyLayout: (template: any) => void;
    onToggleLayoutVisibility: (template: any) => void;
    selectedSnippetId?: string | null;
    onInsertSnippet?: (widgetId: string, props?: Record<string, any>, snippetId?: string) => void;
    onDeleteSnippet?: (id: string) => void;
    onCloseSnippet?: () => void;
}

export const EditorRightPanel = ({
    selectedWidgetId,
    selectedContainerId,
    showTypeFields,
    page,
    selectedPageId,
    assignedTypes,
    onPageUpdate,
    contextVariables,
    setSelectedWidgetId,
    selectedLayout,
    onRenameLayout,
    onDeleteLayout,
    onApplyLayout,
    onToggleLayoutVisibility,
    selectedSnippetId,
    onInsertSnippet,
    onDeleteSnippet,
    onCloseSnippet,
}: EditorRightPanelProps) => {
    const { snippets, updateSnippetName, updateSnippetData, removeSnippet } = useWidgetSnippets();
    const selectedSnippet = selectedSnippetId ? snippets.find(s => s.id === selectedSnippetId) : null;

    if (!selectedWidgetId && !selectedContainerId && !showTypeFields && !selectedLayout && !selectedSnippet) return null;

    return (
        <>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={25} minSize={20} maxSize={50} order={2} id="user-page-props">
                <div className="h-full flex flex-col shrink-0 transition-all duration-300 overflow-hidden bg-background">
                    {selectedSnippet ? (
                        <SnippetPropertyPanel
                            snippet={selectedSnippet}
                            onInsert={(widgetId, props) => onInsertSnippet?.(widgetId, props, selectedSnippet.id)}
                            onDelete={async (id) => {
                                await removeSnippet(id);
                                onDeleteSnippet?.(id);
                            }}
                            onRename={(id, name) => updateSnippetName(id, name)}
                            onPropsUpdate={(id, data) => updateSnippetData(id, data)}
                            onClose={() => onCloseSnippet?.()}
                        />
                    ) : selectedLayout ? (
                        <LayoutPropertyPanel
                            layout={selectedLayout}
                            onRename={(name) => onRenameLayout(selectedLayout, name)}
                            onDelete={() => onDeleteLayout(selectedLayout)}
                            onApply={() => onApplyLayout(selectedLayout)}
                            onToggleVisibility={() => onToggleLayoutVisibility(selectedLayout)}
                        />
                    ) : selectedWidgetId ? (
                        <Suspense fallback={<div className="h-full flex items-center justify-center text-muted-foreground">Loading settings...</div>}>
                            <WidgetPropertyPanel
                                pageId={selectedPageId || `page-${page.id}`}
                                selectedWidgetId={selectedWidgetId}
                                onWidgetRenamed={setSelectedWidgetId}
                                contextVariables={contextVariables}
                            />
                        </Suspense>
                    ) : selectedContainerId ? (
                        <Suspense fallback={<div className="h-full flex items-center justify-center text-muted-foreground">Loading settings...</div>}>
                            <ContainerPropertyPanel
                                pageId={selectedPageId || `page-${page.id}`}
                                selectedContainerId={selectedContainerId}
                            />
                        </Suspense>
                    ) : showTypeFields ? (
                        <div className="h-full overflow-y-auto p-4">
                            <Suspense fallback={<div className="h-full flex items-center justify-center text-muted-foreground">Loading types...</div>}>
                                <UserPageTypeFields
                                    pageId={page.id}
                                    pageMeta={page.meta}
                                    assignedTypes={assignedTypes}
                                    isEditMode={true}
                                    onMetaUpdate={(newMeta) => onPageUpdate({ ...page, meta: newMeta })}
                                />
                            </Suspense>
                        </div>
                    ) : null}
                </div>
            </ResizablePanel>
        </>
    );
};
