import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from "@/components/ui/badge";
import { T } from "@/i18n";
import { FileText, Calendar, FolderTree, EyeOff } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Page, UserProfile } from "../types";

type Layout = any; // TODO: replace with actual type

const PageActions = React.lazy(() => import("../PageActions").then(module => ({ default: module.PageActions })));

export interface UserPageDetailsViewProps {
    page: Page;
    userProfile: UserProfile | null;
    isOwner: boolean;
    isEditMode?: boolean;
    embedded?: boolean;
    userId: string;
    orgSlug?: string;
    onPageUpdate: (updatedPage: Page) => void;
    onToggleEditMode: () => void;
    onWidgetRename: (id: string | null) => void;
    templates?: Layout[];
    onLoadTemplate?: (template: Layout) => void;
    showActions?: boolean;
    ActionsComponent?: React.ComponentType<any>;
    contextVariables?: Record<string, any>;
}

const UserPageDetailsView: React.FC<UserPageDetailsViewProps> = ({
    page,
    userProfile,
    isOwner,
    isEditMode = false,
    embedded = false,
    userId,
    orgSlug,
    onPageUpdate,
    onToggleEditMode,
    onWidgetRename,
    templates,
    onLoadTemplate,
    showActions = true,
    ActionsComponent = PageActions,
    contextVariables = {},
}) => {
    const showAuthor = contextVariables['showAuthor'] !== 'false' && contextVariables['showAuthor'] !== false;
    const showDate = contextVariables['showDate'] !== 'false' && contextVariables['showDate'] !== false;
    const showCategories = contextVariables['showCategories'] !== 'false' && contextVariables['showCategories'] !== false;
    const computedShowActions = contextVariables['showActions'] !== 'false' && contextVariables['showActions'] !== false && showActions;
    const showParent = contextVariables['showParent'] !== 'false' && contextVariables['showParent'] !== false;
    const showTitle = contextVariables['showTitle'] !== 'false' && contextVariables['showTitle'] !== false;

    if (!showTitle && !showAuthor && !showDate && !showCategories && !showParent && !computedShowActions) {
        return null;
    }

    return (
        <div className="dark:bg-slate-900/50 p-2 mb-2">
            <div className="flex items-start gap-4">
                <div className="flex-1">
                    {/* Parent Page Eyebrow */}
                    {page.parent_page && showParent && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                            <Link
                                to={orgSlug ? `/org/${orgSlug}/user/${userId}/pages/${page.parent_page.slug}` : `/user/${userId}/pages/${page.parent_page.slug}`}
                                className="hover:text-primary transition-colors flex items-center gap-1"
                            >
                                <FileText className="h-3 w-3" />
                                <span>{page.parent_page.title}</span>
                            </Link>
                        </div>
                    )}

                    {/* Title */}
                    {showTitle && (
                        <h1
                            className="text-3xl font-bold mb-2"
                            data-testid="page-title-display"
                        >
                            {page.title}
                        </h1>
                    )}

                    <div className="flex flex-col gap-2 mt-2">
                        {/* Only show the info row if either author or date is shown */}
                        {(showAuthor || showDate) && (
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                {showAuthor && userProfile && (
                                    <Link
                                        to={orgSlug ? `/org/${orgSlug}/user/${userId}` : `/user/${userId}`}
                                        className="hover:text-primary transition-colors"
                                    >
                                        {userProfile.display_name || userProfile.username || `User ${userId?.slice(0, 8)}`}
                                    </Link>
                                )}
                                {showDate && (
                                    <div className="flex items-center gap-1">
                                        <Calendar className="h-4 w-4" />
                                        {new Date(page.created_at).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {showCategories && (() => {
                            const displayPaths = page.category_paths || (page.categories?.map(c => [c]) || []);
                            if (displayPaths.length === 0) return null;

                            return (
                                <div className="flex flex-col gap-1 mt-1">
                                    {displayPaths.map((path, pathIdx) => (
                                        <div key={pathIdx} className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <FolderTree className="h-4 w-4 shrink-0" />
                                            {path.map((cat, idx) => (
                                                <span key={cat.id} className="flex items-center">
                                                    {idx > 0 && <span className="mx-1 text-muted-foreground/50">/</span>}
                                                    <Link to={`/categories/${cat.slug}`} className="hover:text-primary transition-colors hover:underline">
                                                        {cat.name}
                                                    </Link>
                                                </span>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            );
                        })()}
                    </div>
                </div>
            </div>

            <Separator className="my-2" />

            {/* Tags and Type */}
            <div className="space-y-2 mt-2">
                <div className="flex items-center gap-2 flex-wrap w-full">
                    {!page.visible && isOwner && (
                        <Badge variant="destructive" className="flex items-center gap-1">
                            <EyeOff className="h-3 w-3" />
                            <T>Hidden</T>
                        </Badge>
                    )}
                    {!page.is_public && (
                        <Badge variant="secondary" className="bg-blue-500/10 text-blue-500">
                            <T>Private</T>
                        </Badge>
                    )}

                    {computedShowActions && (
                        <React.Suspense fallback={<div className="h-9 w-24 bg-muted animate-pulse rounded" />}>
                            <ActionsComponent
                                page={page}
                                isOwner={isOwner}
                                isEditMode={false}
                                embedded={embedded}
                                onToggleEditMode={() => {
                                    onToggleEditMode();
                                    onWidgetRename(null);
                                }}
                                onPageUpdate={onPageUpdate}
                                onDelete={() => { }}
                                onMetaUpdated={() => { }}
                                templates={templates}
                                onLoadTemplate={onLoadTemplate}
                            />
                        </React.Suspense>
                    )}
                </div>
                {/* Tags */}
                {page.tags && page.tags.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap w-full">
                        {page.tags.map((tag, index) => (
                            <Badge
                                key={index}
                                variant="secondary"
                            >
                                #{tag}
                            </Badge>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserPageDetailsView;
