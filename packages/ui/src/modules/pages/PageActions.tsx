import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { T, translate } from "@/i18n";
import { cn } from "@/lib/utils";
import { Page } from "./types";
import { Eye, EyeOff, Edit3, Trash2, Share2, Link as LinkIcon, FileText, Download, FolderTree, FileJson, LayoutTemplate, ShoppingCart, ExternalLink, History } from "lucide-react";
import { useCartStore } from "@polymech/ecommerce";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
    DropdownMenuGroup
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { updatePage, updatePageMeta, deletePage } from "./client-pages";
import { serverUrl } from "@/lib/db";

const CategoryManager = React.lazy(() => import("@/components/widgets/CategoryManager").then(module => ({ default: module.CategoryManager })));
const VersionManager = React.lazy(() => import("./VersionManager").then(module => ({ default: module.VersionManager })));

type Layout = any; // TODO: replace with actual type


interface PageActionsProps {
    page: Page;
    isOwner: boolean;
    isEditMode?: boolean;
    embedded?: boolean;
    onToggleEditMode?: () => void;
    onPageUpdate: (updatedPage: Page) => void;
    onDelete?: () => void;
    onMetaUpdated?: () => void;
    className?: string;
    showLabels?: boolean;
    templates?: Layout[];
    onLoadTemplate?: (template: Layout) => void;
}

export const PageActions = ({
    page,
    isOwner,
    isEditMode = false,
    embedded = false,
    onToggleEditMode,
    onPageUpdate,
    onDelete,
    onMetaUpdated,
    className,
    showLabels = true,
    templates,
    onLoadTemplate
}: PageActionsProps) => {
    const [loading, setLoading] = useState(false);
    const [showCategoryManager, setShowCategoryManager] = useState(false);
    const [showVersionManager, setShowVersionManager] = useState(false);
    const addItem = useCartStore((s) => s.addItem);
    const navigate = useNavigate();

    const baseUrl = serverUrl;

    // Extract product price from typeValues (first entry with a numeric price > 0)
    const productPrice = (() => {
        if (!page.meta?.typeValues) return null;
        for (const tv of Object.values(page.meta.typeValues) as any[]) {
            if (tv && typeof tv.price === 'number' && tv.price > 0) return tv.price;
        }
        return null;
    })();

    const handleAddToCart = () => {
        if (productPrice === null) return;
        // Extract vendor username from URL: /user/{username}/pages/{slug}
        const pathParts = window.location.pathname.split('/');
        const userIdx = pathParts.indexOf('user');
        const vendorSlug = userIdx >= 0 ? pathParts[userIdx + 1] : undefined;
        addItem({
            id: `page-${page.id}`,
            title: page.title,
            price: productPrice,
            image: page.meta?.thumbnail || undefined,
            vendorSlug,
            pageSlug: page.slug,
        });
        toast.success(translate('Added to cart'));
    };

    const invalidatePageCache = async () => {
    };
    const handleMetaUpdate = async (newMeta: any) => {
        // Update local state immediately for responsive UI
        onPageUpdate({ ...page, meta: newMeta });
        // Persist to database
        try {
            await updatePageMeta(page.id, newMeta);
            // Trigger parent refresh to get updated category_paths
            if (onMetaUpdated) {
                onMetaUpdated();
            }
        } catch (error) {
            console.error('Failed to update page meta:', error);
            toast.error(translate('Failed to update categories'));
        }
    };

    const handleToggleVisibility = async (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (loading) return;
        setLoading(true);

        try {
            await updatePage(page.id, { visible: !page.visible });

            onPageUpdate({ ...page, visible: !page.visible });
            toast.success(translate(page.visible ? 'Page hidden' : 'Page made visible'));
            invalidatePageCache();
        } catch (error) {
            console.error('Error toggling visibility:', error);
            toast.error(translate('Failed to update page visibility'));
        } finally {
            setLoading(false);
        }
    };

    const handleTogglePublic = async (e?: React.MouseEvent) => {
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
    };

    const handleCopyLink = async () => {
        const url = window.location.href;
        const title = page.title || 'PolyMech Page';

        if (navigator.share && navigator.canShare({ url, title })) {
            try {
                await navigator.share({ url, title });
                return;
            } catch (e) {
                if ((e as Error).name !== 'AbortError') console.error('Share failed', e);
            }
        }

        try {
            await navigator.clipboard.writeText(url);
            toast.success(translate("Link copied to clipboard"));
        } catch (e) {
            console.error('Clipboard failed', e);
            toast.error(translate("Failed to copy link"));
        }
    };

    const processPageContent = (content: any): string => {
        if (!content) return '';
        if (typeof content === 'string') return content;

        let markdown = '';
        try {
            // Determine content root
            // Some versions might have content directly, others wrapped in { pages: { [id]: { containers: ... } } }
            let root = content;
            if (content.pages) {
                // Try to find the page by ID or take the first one
                const pageIdKey = `page-${page.id}`;
                if (content.pages[pageIdKey]) {
                    root = content.pages[pageIdKey];
                } else {
                    // Fallback: take first key
                    const keys = Object.keys(content.pages);
                    if (keys.length > 0) root = content.pages[keys[0]];
                }
            }

            // Traverse containers
            if (root.containers && Array.isArray(root.containers)) {
                root.containers.forEach((container: any) => {
                    if (container.widgets && Array.isArray(container.widgets)) {
                        container.widgets.forEach((widget: any) => {
                            if (widget.widgetId === 'markdown-text' && widget.props && widget.props.content) {
                                markdown += widget.props.content + '\n\n';
                            }
                            // Future: Handle other widgets if needed
                        });
                    }
                });
            } else if (root.widgets && Array.isArray(root.widgets)) { // Fallback for simple structure
                root.widgets.forEach((widget: any) => {
                    if (widget.widgetId === 'markdown-text' && widget.props && widget.props.content) {
                        markdown += widget.props.content + '\n\n';
                    }
                });
            }
        } catch (e) {
            console.error('Error parsing page content:', e);
            return JSON.stringify(content, null, 2); // Fallback to raw JSON
        }

        // URL Resolution logic is handled by markdown-text widget content usually containing relative URLs
        // If we need to process them:
        // markdown = markdown.replace(/!\[(.*?)\]\((.*?)\)/g, (match, alt, url) => { ... });
        // For now returning raw markdown as user requested "mind url" likely meant for PDF which runs server side.
        // Client side export usually keeps links as is unless they are purely internal IDs.

        return markdown;
    };

    const getSlug = (text: string) => text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');

    const handleExportMarkdown = () => {
        try {
            // Get current URL and append .md extension
            const currentUrl = new URL(window.location.href);
            const pathWithExtension = currentUrl.pathname + '.md';
            const exportUrl = `${currentUrl.origin}${pathWithExtension}${currentUrl.search}`;

            // Open in new tab to trigger download
            window.open(exportUrl, '_blank');
            toast.success(translate("Markdown export opened"));
        } catch (e) {
            console.error("Markdown export failed", e);
            toast.error(translate("Failed to export Markdown"));
        }
    };

    const handleEmbed = async () => {
        // Embed logic: Copy iframe code
        // Route: /embed/:id is currently for posts. But maybe it works for pages if we update the backend?
        // Wait, current serving index.ts handleGetEmbed fetches from 'posts' table only.
        // User asked for "embed (HTML)".
        // Assuming we should point to a route that RENDERS the page.
        // If we don't have a dedicated page embed route yet, we might need one.
        // However, the user said "see dedicated app route ( @[src/main-embed.tsx] )".
        // This suggests the frontend app handles it.
        // The backend route `/embed/:id` serves the HTML that bootstraps `main-embed.tsx`.
        // So we just need to use that URL. BUT `handleGetEmbed` in backend fetches from `posts`.
        // We probably need `handleGetEmbedPage` or update `handleGetEmbed` to support pages.
        // For now, let's assume valid URL structure is `/embed/page/:id` which we plan to add or `/embed/:id` if we unify.
        // Let's use `/embed/page/${page.id}` in the snippet and ensure backend supports it.

        const embedUrl = `${baseUrl}/embed/page/${page.id}`;
        const iframeCode = `<iframe src="${embedUrl}" width="100%" height="600" frameborder="0" allowfullscreen></iframe>`;

        try {
            await navigator.clipboard.writeText(iframeCode);
            toast.success(translate("Embed code copied to clipboard"));
        } catch (e) {
            toast.error(translate("Failed to copy embed code"));
        }
    };

    const handleExportAstro = async () => {
        try {
            // Re-use markdown export logic
            let content = processPageContent(page.content);
            const slug = getSlug(page.title || 'page');

            // Generate TOC (same as markdown export)
            const lines = content.split('\n');
            let toc = '# Table of Contents\n\n';
            let hasHeadings = false;

            lines.forEach(line => {
                const match = line.match(/^(#{1,3})\s+(.+)/);
                if (match) {
                    hasHeadings = true;
                    const level = match[1].length;
                    const text = match[2];
                    const id = getSlug(text);
                    const indent = '  '.repeat(level - 1);
                    toc += `${indent}- [${text}](#${id})\n`;
                }
            });

            if (hasHeadings) {
                content = `${toc}\n---\n\n${content}`;
            }

            // Construct Front Matter
            const safeTitle = (page.title || 'Untitled').replace(/"/g, '\\"');
            const safeSlug = (page.slug || slug).replace(/"/g, '\\"');
            const dateStr = new Date().toISOString().split('T')[0];

            // Note: Page interface in PageActions might need update to include tags if we want them
            // For now, using standard props we have

            const frontMatter = `---
title: "${safeTitle}"
slug: "${safeSlug}"
date: "${dateStr}"
author: "${page.owner}"
draft: ${!page.visible}
---

`;

            const finalContent = frontMatter + content;
            const blob = new Blob([finalContent], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${slug}.astro`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            toast.success(translate("Astro export downloaded"));
        } catch (e) {
            console.error("Astro export failed", e);
            toast.error(translate("Failed to export Astro"));
        }
    };

    const handleExportPdf = async () => {
        try {
            // Get current URL and append .pdf extension
            const currentUrl = new URL(window.location.href);
            const pathWithExtension = currentUrl.pathname + '.pdf';
            const exportUrl = `${currentUrl.origin}${pathWithExtension}${currentUrl.search}`;

            // Open in new tab to trigger download
            window.open(exportUrl, '_blank');
            toast.success(translate("PDF export opened"));
        } catch (e) {
            console.error(e);
            toast.error(translate("Failed to export PDF"));
        }
    };

    const handleDumpJson = async () => {
        try {
            const pageJson = JSON.stringify(page, null, 2);
            console.log('Page JSON:', pageJson);
            await navigator.clipboard.writeText(pageJson);
            toast.success(translate("Page JSON dumped to console and clipboard"));
        } catch (e) {
            console.error("Failed to dump JSON", e);
            toast.error(translate("Failed to dump JSON"));
        }
    };

    return (
        <div className={cn("flex items-center gap-2", className)}>
            {/* Open Standalone - break out of embedded view */}
            {embedded && (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                        e.stopPropagation();
                        window.open(`/user/${page.owner}/pages/${page.slug}`, '_blank');
                    }}
                    className="gap-2"
                    title={translate("Open in full page")}
                >
                    <ExternalLink className="h-4 w-4" />
                    {showLabels && <span className="hidden md:inline"><T>Open</T></span>}
                </Button>
            )}
            {/* Add to Cart - only for product pages with a price */}
            {productPrice !== null && (
                <Button
                    variant="default"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); handleAddToCart(); }}
                    className="gap-2 bg-primary text-primary-foreground"
                >
                    <ShoppingCart className="h-4 w-4" />
                    {showLabels && (
                        <span className="hidden md:inline">
                            ${productPrice.toLocaleString()} — <T>Add to Cart</T>
                        </span>
                    )}
                </Button>
            )}

            {/* Export Menu */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                        <Download className="h-4 w-4" />
                        {showLabels && <span className="hidden md:inline"><T>Export</T></span>}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel><T>Export & Share</T></DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleCopyLink}>
                        <LinkIcon className="h-4 w-4 mr-2" />
                        <span><T>Copy Link</T></span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportMarkdown}>
                        <FileText className="h-4 w-4 mr-2" />
                        <span><T>Export Markdown</T></span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportPdf}>
                        <FileText className="h-4 w-4 mr-2" />
                        <span><T>Export PDF</T></span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportAstro}>
                        <FileText className="mr-2 h-4 w-4" />
                        <span><T>Export Astro</T> (Beta)</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleEmbed}>
                        <LinkIcon className="h-4 w-4 mr-2" />
                        <span><T>Embed (HTML)</T></span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Owner Controls */}
            {isOwner && (
                <>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleToggleVisibility}
                        disabled={loading}
                        className={cn(!page.visible && "text-muted-foreground")}
                    >
                        {page.visible ? (
                            <>
                                <Eye className={cn("h-4 w-4", showLabels && "md:mr-2")} />
                                {showLabels && <span className="hidden md:inline"><T>Visible</T></span>}
                            </>
                        ) : (
                            <>
                                <EyeOff className={cn("h-4 w-4", showLabels && "md:mr-2")} />
                                {showLabels && <span className="hidden md:inline"><T>Hidden</T></span>}
                            </>
                        )}
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleTogglePublic}
                        disabled={loading}
                        className={cn(!page.is_public && "text-muted-foreground")}
                    >
                        {showLabels ? (
                            <>
                                <span className="hidden md:inline"><T>{page.is_public ? 'Public' : 'Private'}</T></span>
                                <span className="md:hidden"><T>{page.is_public ? 'Pub' : 'Priv'}</T></span>
                            </>
                        ) : (
                            <span className="text-xs">{page.is_public ? 'Pub' : 'Priv'}</span>
                        )}
                    </Button>

                    {onToggleEditMode && (
                        <Button
                            variant={isEditMode ? "default" : "outline"}
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); onToggleEditMode(); }}
                            className={isEditMode ? "bg-primary text-white" : ""}
                            data-testid="edit-mode-toggle"
                        >
                            {isEditMode ? (
                                <>
                                    <Eye className={cn("h-4 w-4", showLabels && "md:mr-2")} />
                                    {showLabels && <span className="hidden md:inline"><T>View</T></span>}
                                </>
                            ) : (
                                <>
                                    <Edit3 className={cn("h-4 w-4", showLabels && "md:mr-2")} />
                                    {showLabels && <span className="hidden md:inline"><T>Edit</T></span>}
                                </>
                            )}
                        </Button>
                    )}

                    {/* Layout Template Picker - Only in Edit Mode */}
                    {isEditMode && templates && onLoadTemplate && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-2" onClick={(e) => e.stopPropagation()}>
                                    <LayoutTemplate className="h-4 w-4" />
                                    {showLabels && <span className="hidden md:inline"><T>Layout</T></span>}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end">
                                <DropdownMenuLabel><T>Load Template</T></DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuGroup>
                                    {templates.length === 0 ? (
                                        <div className="px-2 py-1.5 text-xs text-muted-foreground"><T>No templates found</T></div>
                                    ) : (
                                        templates.map((t) => (
                                            <DropdownMenuItem key={t.id} onClick={() => onLoadTemplate(t)}>
                                                {t.name}
                                            </DropdownMenuItem>
                                        ))
                                    )}
                                </DropdownMenuGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}

                    {/* Categorization - New All-in-One Component */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); setShowCategoryManager(true); }}
                        className={cn("text-muted-foreground hover:text-foreground", page.meta?.categoryId && "text-primary border-primary")}
                        title={translate("Manage Categories")}
                    >
                        <FolderTree className="h-4 w-4" />
                        {showLabels && <span className="ml-2 hidden md:inline"><T>Categories</T></span>}
                    </Button>

                    <React.Suspense fallback={null}>
                        {showCategoryManager && (
                            <CategoryManager
                                isOpen={showCategoryManager}
                                onClose={() => setShowCategoryManager(false)}
                                currentPageId={page.id}
                                currentPageMeta={page.meta}
                                onPageMetaUpdate={handleMetaUpdate}
                                filterByType="pages"
                                defaultMetaType="pages"
                            />
                        )}
                    </React.Suspense>

                    {/* Version Manager */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); setShowVersionManager(true); }}
                        className="text-muted-foreground hover:text-foreground"
                        title={translate("Versions")}
                    >
                        <History className="h-4 w-4" />
                        {showLabels && <span className="ml-2 hidden md:inline"><T>Versions</T></span>}
                    </Button>

                    <React.Suspense fallback={null}>
                        {showVersionManager && (
                            <VersionManager
                                isOpen={showVersionManager}
                                onClose={() => setShowVersionManager(false)}
                                pageId={page.id}
                                pageTitle={page.title}
                            />
                        )}
                    </React.Suspense>



                    {/* Dev Mode: Dump JSON */}
                    {import.meta.env.DEV && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); handleDumpJson(); }}
                            className="text-muted-foreground hover:text-foreground"
                            title="Dump Page JSON (Dev Mode)"
                        >
                            <FileJson className="h-4 w-4" />
                            {showLabels && <span className="ml-2 hidden md:inline"><T>Dump JSON</T></span>}
                        </Button>
                    )}

                    {onDelete && (
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={async (e) => {
                                e.stopPropagation();
                                if (!window.confirm(translate('Are you sure you want to delete this page? This action cannot be undone.'))) return;
                                try {
                                    await deletePage(page.id);
                                    toast.success(translate('Page deleted'));
                                    onDelete();
                                    navigate(`/user/${page.owner}`);
                                } catch (err) {
                                    console.error('Failed to delete page:', err);
                                    toast.error(translate('Failed to delete page'));
                                }
                            }}
                            className="text-destructive hover:text-destructive"
                            disabled={loading}
                        >
                            <Trash2 className="h-4 w-4" />
                            {showLabels && <span className="ml-1 hidden md:inline"><T>Delete</T></span>}
                        </Button>
                    )}
                </>
            )}
        </div>
    );
};
