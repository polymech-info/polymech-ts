import { lazy, Suspense, type ComponentProps } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { T } from "@/i18n";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { TableOfContents } from "@/components/sidebar/TableOfContents";
import { MarkdownHeading } from "@/lib/toc";
import { Page } from "../types";
import CollapsibleSection from "@/components/CollapsibleSection";

const HierarchyTree = lazy(() => import("@/components/sidebar/HierarchyTree").then(module => ({ default: module.HierarchyTree })));
const ChatSidebar = lazy(() => import("@/modules/ai/components/ChatSidebar"));

interface EditorLeftSidebarProps {
    isSidebarCollapsed: boolean;
    onToggleSidebar: () => void;
    childPages: { id: string; title: string; slug: string }[];
    headings: MarkdownHeading[];
    orgSlug?: string;
    userId: string;
    showHierarchy: boolean;
    currentLayout: any;
    selectedWidgetId: string | null;
    selectedContainerId: string | null;
    isPreview: boolean;
    page: Page;
    showEmailPreview: boolean;
    onSelectWidget: (id: string | null) => void;
    onSelectContainer: (id: string | null) => void;
    onOpenSettings: (id: string, type: 'widget' | 'container', layoutId: string) => void;
    setEditingWidgetId: (id: string | null) => void;
    setSelectedPageId: (id: string) => void;
    showChat?: boolean;
    chatSidebarProps?: ComponentProps<typeof ChatSidebar>;
    includePageContext?: boolean;
    onTogglePageContext?: () => void;
}

export const EditorLeftSidebar = ({
    isSidebarCollapsed,
    onToggleSidebar,
    childPages,
    headings,
    orgSlug,
    userId,
    showHierarchy,
    currentLayout,
    selectedWidgetId,
    selectedContainerId,
    isPreview,
    page,
    showEmailPreview,
    onSelectWidget,
    onSelectContainer,
    onOpenSettings,
    setEditingWidgetId,
    setSelectedPageId,
    showChat,
    chatSidebarProps,
    includePageContext,
    onTogglePageContext,
}: EditorLeftSidebarProps) => {
    if (showEmailPreview) return null;
    if (headings.length === 0 && childPages.length === 0 && !showHierarchy && !showChat) return null;

    return (
        <Sidebar className="border-r h-full hidden lg:flex flex-col w-full overflow-hidden">
            <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-end'} p-2 sticky top-0 z-10`}>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground"
                    onClick={onToggleSidebar}
                    title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    {isSidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
                </Button>
            </div>
            {!isSidebarCollapsed && (
                <div className="overflow-y-auto flex-1 pb-4 scrollbar-custom">
                    {showHierarchy && currentLayout && (
                        <CollapsibleSection
                            title={<T>Hierarchy</T>}
                            minimal
                            storageKey="editor-sidebar-hierarchy"
                            contentClassName="p-0"
                        >
                            <Suspense fallback={<div className="p-4 text-xs text-muted-foreground">Loading hierarchy...</div>}>
                                <HierarchyTree
                                    containers={currentLayout.containers}
                                    selectedWidgetId={selectedWidgetId}
                                    selectedContainerId={selectedContainerId}
                                    onSelectWidget={(id) => {
                                        if (isPreview) return;
                                        onSelectWidget(id);
                                        setSelectedPageId(`page-${page.id}`);
                                    }}
                                    onSelectContainer={(id) => {
                                        if (isPreview) return;
                                        onSelectContainer(id);
                                    }}
                                    onSettingsClick={onOpenSettings}
                                    layoutId={`page-${page.id}`}
                                />
                            </Suspense>
                        </CollapsibleSection>
                    )}
                    {childPages.length > 0 && (
                        <CollapsibleSection
                            title={<T>Child Pages</T>}
                            minimal
                            storageKey="editor-sidebar-child-pages"
                            contentClassName="px-4 py-2"
                        >
                            <div className="flex flex-col gap-1">
                                {childPages.map(child => (
                                    <Link
                                        key={child.id}
                                        to={orgSlug ? `/org/${orgSlug}/user/${userId}/pages/${child.slug}` : `/user/${userId}/pages/${child.slug}`}
                                        className="text-sm py-1 px-2 rounded hover:bg-muted truncate block text-foreground/80 hover:text-primary transition-colors"
                                    >
                                        {child.title}
                                    </Link>
                                ))}
                            </div>
                        </CollapsibleSection>
                    )}
                    {headings.length > 0 && (
                        <CollapsibleSection
                            title={<T>Table of Contents</T>}
                            minimal
                            storageKey="editor-sidebar-toc"
                            contentClassName="p-0"
                        >
                            <TableOfContents
                                headings={headings}
                                minHeadingLevel={2}
                                title=""
                                className="border-t-0 pt-2 px-4"
                            />
                        </CollapsibleSection>
                    )}
                    {showChat && chatSidebarProps && (
                        <CollapsibleSection
                            title={<T>AI Chat</T>}
                            minimal
                            storageKey="editor-sidebar-chat"
                            contentClassName="p-0"
                        >
                            <div className="flex items-center justify-between px-3 py-1.5 border-b border-border">
                                <label htmlFor="page-context-toggle" className="text-xs text-muted-foreground cursor-pointer">
                                    <T>Include page context</T>
                                </label>
                                <Switch
                                    id="page-context-toggle"
                                    checked={!!includePageContext}
                                    onCheckedChange={onTogglePageContext}
                                    className="scale-75"
                                />
                            </div>
                            <Suspense fallback={<div className="p-4 text-xs text-muted-foreground">Loading chat...</div>}>
                                <ChatSidebar {...chatSidebarProps} />
                            </Suspense>
                        </CollapsibleSection>
                    )}
                </div>
            )}
        </Sidebar>
    );
};

