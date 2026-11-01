import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { T, translate } from "@/i18n";
import { toast } from "sonner";

const PageActions = React.lazy(() => import("../PageActions").then(module => ({ default: module.PageActions })));

import {
    FileText, Check, X, Calendar, FolderTree, EyeOff, Plus
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useLayout } from "@/modules/layout/LayoutContext";
import { UpdatePageMetaCommand } from "@/modules/layout/commands";
import { Page, UserProfile } from "../types";

import { updatePageMeta } from '../client-pages';

type Layout = any; // TODO: replace with actual type

export interface UserPageDetailsEditProps {
    page: Page;
    userProfile: UserProfile | null;
    isOwner: boolean;
    isEditMode: boolean;
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

const UserPageDetailsEdit: React.FC<UserPageDetailsEditProps> = ({
    page,
    userProfile,
    isOwner,
    isEditMode,
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
    // State for inline editing
    const [editingTitle, setEditingTitle] = useState(false);
    const [editingTags, setEditingTags] = useState(false);
    const [editingSlug, setEditingSlug] = useState(false);
    const [titleValue, setTitleValue] = useState("");
    const [tagsValue, setTagsValue] = useState("");
    const [slugValue, setSlugValue] = useState("");
    const [savingField, setSavingField] = useState<string | null>(null);

    const { executeCommand } = useLayout();

    const showAuthor = isEditMode || (contextVariables['showAuthor'] !== 'false' && contextVariables['showAuthor'] !== false);
    const showDate = isEditMode || (contextVariables['showDate'] !== 'false' && contextVariables['showDate'] !== false);
    const showCategories = isEditMode || (contextVariables['showCategories'] !== 'false' && contextVariables['showCategories'] !== false);
    const computedShowActions = isEditMode || (contextVariables['showActions'] !== 'false' && contextVariables['showActions'] !== false && showActions);
    const showParent = isEditMode || (contextVariables['showParent'] !== 'false' && contextVariables['showParent'] !== false);
    const showTitle = isEditMode || (contextVariables['showTitle'] !== 'false' && contextVariables['showTitle'] !== false);

    const handleSaveTitle = async () => {
        if (!page || !titleValue.trim()) {
            toast.error(translate('Title cannot be empty'));
            return;
        }

        setSavingField('title');
        try {
            const pageId = `page-${page.id}`;
            const command = new UpdatePageMetaCommand(
                pageId,
                { title: page.title }, // Old meta
                { title: titleValue.trim() }, // New meta
                (meta) => {
                    // This callback runs on execute and undo to update local UI state if needed
                    // For local state 'page', we might need to merge.
                    // However, 'onPageUpdate' prop is what updates the parent state.
                    // The command calls context.updatePageMetadata which updates the context.
                    // But UserPageDetails relies on 'page' prop.
                    // We should call onPageUpdate here.
                    if (meta.title) onPageUpdate({ ...page, title: meta.title });
                }
            );

            await executeCommand(command);
            setEditingTitle(false);
            toast.success(translate('Title updated (unsaved)'));
        } catch (error) {
            console.error('Error updating title:', error);
            toast.error(translate('Failed to update title'));
        } finally {
            setSavingField(null);
        }
    };

    const handleSaveTags = async () => {
        if (!page) return;

        setSavingField('tags');
        try {
            const newTags = tagsValue
                .split(',')
                .map(tag => tag.trim())
                .filter(tag => tag.length > 0);

            await updatePageMeta(page.id, { tags: newTags.length > 0 ? newTags : null });
            onPageUpdate({ ...page, tags: newTags.length > 0 ? newTags : null });
            setEditingTags(false);
            toast.success(translate('Tags updated'));
        } catch (error) {
            console.error('Error updating tags:', error);
            toast.error(translate('Failed to update tags'));
        } finally {
            setSavingField(null);
        }
    };

    const handleStartEditTitle = () => {
        setTitleValue(page?.title || '');
        setEditingTitle(true);
    };

    const handleStartEditTags = () => {
        setTagsValue(page?.tags?.join(', ') || '');
        setEditingTags(true);
    };

    const handleSaveSlug = async () => {
        if (!page || !slugValue.trim()) {
            toast.error(translate('Slug cannot be empty'));
            return;
        }

        setSavingField('slug');
        try {
            const pageId = `page-${page.id}`;
            const command = new UpdatePageMetaCommand(
                pageId,
                { slug: page.slug }, // Old meta
                { slug: slugValue.trim() }, // New meta
                (meta) => {
                    if (meta.slug) onPageUpdate({ ...page, slug: meta.slug });
                }
            );

            await executeCommand(command);
            setEditingSlug(false);
            toast.success(translate('Slug updated (unsaved)'));
        } catch (error) {
            console.error('Error updating slug:', error);
            toast.error(translate('Failed to update slug'));
        } finally {
            setSavingField(null);
        }
    };

    const handleStartEditSlug = () => {
        setSlugValue(page?.slug || '');
        setEditingSlug(true);
    };

    if (!showTitle && !showAuthor && !showDate && !showCategories && !showParent && !computedShowActions && !isEditMode) {
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

                    {/* Editable Title */}
                    {showTitle && (
                        editingTitle && isOwner && isEditMode ? (
                            <div className="flex items-center gap-2 mb-2">
                            <Input
                                value={titleValue}
                                onChange={(e) => setTitleValue(e.target.value)}
                                className="text-3xl font-bold h-12"
                                placeholder="Page title..."
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveTitle();
                                    if (e.key === 'Escape') setEditingTitle(false);
                                }}
                                autoFocus
                                disabled={savingField === 'title'}
                                data-testid="page-title-input"
                            />
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleSaveTitle}
                                disabled={savingField === 'title'}
                                data-testid="page-title-save"
                            >
                                <Check className="h-4 w-4" />
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingTitle(false)}
                                disabled={savingField === 'title'}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ) : (
                        <h1
                            className={`text-3xl font-bold mb-2 ${isOwner && isEditMode ? 'cursor-pointer hover:text-primary transition-colors' : ''}`}
                            onClick={() => isOwner && isEditMode && handleStartEditTitle()}
                            title={isOwner && isEditMode ? 'Click to edit title' : ''}
                            data-testid="page-title-display"
                        >
                            {page.title}
                        </h1>
                        )
                    )}

                    {/* Editable Slug */}
                    {isEditMode ? (
                        editingSlug && isOwner ? (
                            <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                                <span>/</span>
                                <Input
                                    value={slugValue}
                                    onChange={(e) => setSlugValue(e.target.value)}
                                    className="font-mono text-sm h-8 w-64"
                                    placeholder="page-slug"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSaveSlug();
                                        if (e.key === 'Escape') setEditingSlug(false);
                                    }}
                                    autoFocus
                                    disabled={savingField === 'slug'}
                                    data-testid="page-slug-input"
                                />
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={handleSaveSlug}
                                    disabled={savingField === 'slug'}
                                    className="h-8 w-8 p-0"
                                >
                                    <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setEditingSlug(false)}
                                    disabled={savingField === 'slug'}
                                    className="h-8 w-8 p-0"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ) : (
                            <div
                                className={`flex items-center gap-1 text-sm font-mono mb-2 text-muted-foreground ${isOwner ? 'cursor-pointer hover:text-primary transition-colors' : ''}`}
                                onClick={() => isOwner && handleStartEditSlug()}
                                title={isOwner ? 'Click to edit slug' : ''}
                                data-testid="page-slug-display"
                            >
                                <span className="opacity-50">/</span>
                                <span>{page.slug}</span>
                            </div>
                        )
                    ) : null}

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

                    {/* PageActions - Only visible in View Mode (Edit Mode uses PageRibbonBar) */}
                    {!isEditMode && computedShowActions && (
                        <React.Suspense fallback={<div className="h-9 w-24 bg-muted animate-pulse rounded" />}>
                            <ActionsComponent
                                page={page}
                                isOwner={isOwner}
                                isEditMode={isEditMode}
                                embedded={embedded}
                                onToggleEditMode={() => {
                                    onToggleEditMode();
                                    if (isEditMode) onWidgetRename(null);
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
                {/* Editable Tags */}
                {editingTags && isOwner && isEditMode ? (
                    <div className="flex items-start gap-2">
                        <div className="flex-1">
                            <Input
                                value={tagsValue}
                                onChange={(e) => setTagsValue(e.target.value)}
                                className="text-sm"
                                placeholder="tag1, tag2, tag3..."
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveTags();
                                    if (e.key === 'Escape') setEditingTags(false);
                                }}
                                autoFocus
                                disabled={savingField === 'tags'}
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Separate tags with commas
                            </p>
                        </div>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleSaveTags}
                            disabled={savingField === 'tags'}
                        >
                            <Check className="h-4 w-4" />
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingTags(false)}
                            disabled={savingField === 'tags'}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 flex-wrap w-full">
                        {page.tags && page.tags.map((tag, index) => (
                            <Badge
                                key={index}
                                variant="secondary"
                                className={isOwner && isEditMode ? 'cursor-pointer hover:bg-secondary/80' : ''}
                                onClick={() => isOwner && isEditMode && handleStartEditTags()}
                            >
                                #{tag}
                            </Badge>
                        ))}
                        {isOwner && isEditMode && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-xs text-muted-foreground"
                                onClick={handleStartEditTags}
                            >
                                <Plus className="h-3 w-3 mr-1" />
                                <T>Edit Tags</T>
                            </Button>
                        )}
                    </div>
                )}
            </div>

        </div >
    );
};

export default UserPageDetailsEdit;
