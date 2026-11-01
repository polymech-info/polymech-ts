import React from "react";
import { Link } from "react-router-dom";
import { LayoutGrid, Edit3, MoreVertical, Trash2, Save, X, Grid, FolderTree, ExternalLink, Eye, EyeOff, Lock } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { T } from '@/i18n';

import MarkdownRenderer from "@/components/MarkdownRenderer";
import UserAvatarBlock from "@/components/UserAvatarBlock";
import { ExportDropdown } from "../../components/ExportDropdown";

import { PostMediaItem, UserProfile } from "../../types";

interface CompactPostHeaderProps {
    isEditMode: boolean;
    post: any;
    localPost: any;
    setLocalPost: (post: any) => void;
    mediaItem: PostMediaItem;
    authorProfile: UserProfile;
    isOwner: boolean;
    embedded?: boolean;
    onViewModeChange: (mode: 'thumbs' | 'compact') => void;
    onExportMarkdown: (type: 'hugo' | 'obsidian' | 'raw') => void;
    onSaveChanges: () => void;
    onEditModeToggle: () => void;
    onEditPost: () => void;
    onDeletePicture: () => void;
    onDeletePost: () => void;
    onCategoryManagerOpen?: () => void;
    mediaItems: PostMediaItem[];
    localMediaItems?: PostMediaItem[];
}

export const CompactPostHeader: React.FC<CompactPostHeaderProps> = ({
    isEditMode,
    post,
    localPost,
    setLocalPost,
    mediaItem,
    authorProfile,
    isOwner,
    embedded = false,
    onViewModeChange,
    onExportMarkdown,
    onSaveChanges,
    onEditModeToggle,
    onEditPost,
    onDeletePicture,
    onDeletePost,
    onCategoryManagerOpen,
    mediaItems,
    localMediaItems
}) => {
    return (
        <>
            {/* Post Title/Description + Actions — same row */}
            {isEditMode && !post?.isPseudo ? (
                <div className="p-3 border-b space-y-2">
                    <Input
                        value={localPost?.title || ''}
                        onChange={(e) => setLocalPost && setLocalPost({ ...localPost!, title: e.target.value })}
                        className="font-bold text-lg"
                        placeholder="Post Title"
                    />
                    <Textarea
                        value={localPost?.description || ''}
                        onChange={(e) => setLocalPost && setLocalPost({ ...localPost!, description: e.target.value })}
                        className="text-sm"
                        placeholder="Post Description"
                    />
                    {/* Visibility */}
                    <div className="flex items-center gap-2">
                        <Select
                            value={localPost?.settings?.visibility || 'public'}
                            onValueChange={(value) => setLocalPost && setLocalPost({
                                ...localPost!,
                                settings: { ...(localPost?.settings || {}), visibility: value }
                            })}
                        >
                            <SelectTrigger className="h-8 w-[180px] text-xs">
                                <SelectValue placeholder="Visibility" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="public"><div className="flex items-center gap-2"><Eye className="h-3 w-3" /><T>Public</T></div></SelectItem>
                                <SelectItem value="listed"><div className="flex items-center gap-2"><EyeOff className="h-3 w-3" /><T>Unlisted</T></div></SelectItem>
                                <SelectItem value="private"><div className="flex items-center gap-2"><Lock className="h-3 w-3" /><T>Private</T></div></SelectItem>
                            </SelectContent>
                        </Select>
                        <span className="text-xs text-muted-foreground">
                            {localPost?.settings?.visibility === 'listed' && <T>Accessible only via direct link.</T>}
                            {localPost?.settings?.visibility === 'private' && <T>Only you can see this post.</T>}
                        </span>
                    </div>
                    {/* Edit-mode actions */}
                    <div className="flex items-center gap-1 pt-1">
                        {isOwner && (
                            <>
                                <Button variant="ghost" size="sm" onClick={onSaveChanges} className="h-8 w-8 p-0 text-green-600 hover:text-green-700" title="Save changes">
                                    <Save className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={onEditModeToggle} className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive" title="Cancel edit">
                                    <X className="h-4 w-4" />
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            ) : (
                <div className="p-3 border-b">
                    <div className="flex flex-col-reverse gap-3">
                        {/* Title + Description */}
                        <div className="min-w-0 w-full">
                            {post && post.title && post.title !== mediaItem?.title && (
                                <h1 className="text-lg font-bold mb-1">{post.title}</h1>
                            )}
                            {post?.description && <MarkdownRenderer content={post.description} className="prose-sm text-sm text-foreground/90 mb-2" />}
                        </div>

                        {/* Category Breadcrumbs */}
                        {(() => {
                            const displayPaths = (post as any)?.category_paths || [];
                            if (displayPaths.length === 0) return null;

                            return (
                                <div className="flex flex-col gap-1">
                                    {displayPaths.map((path: any[], pathIdx: number) => (
                                        <div key={pathIdx} className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <FolderTree className="h-4 w-4 shrink-0" />
                                            {path.map((cat: any, idx: number) => (
                                                <span key={cat.id} className="flex items-center">
                                                    {idx > 0 && <span className="mx-1 text-muted-foreground/50">/</span>}
                                                    <a href={`/categories/${cat.slug}`} className="hover:text-primary transition-colors hover:underline">
                                                        {cat.name}
                                                    </a>
                                                </span>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            );
                        })()}

                        {/* Author / Date */}
                        <div>
                            <UserAvatarBlock
                                userId={mediaItem.user_id}
                                avatarUrl={authorProfile?.avatar_url}
                                displayName={authorProfile?.display_name}
                                createdAt={mediaItem.created_at}
                                className="w-8 h-8"
                            />
                        </div>

                        {/* Actions toolbar */}
                        <div className="flex items-center justify-end gap-1 flex-wrap shrink-0">
                            <div className="flex items-center bg-muted/50 rounded-lg p-1 mr-1 border">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-muted-foreground"
                                    onClick={() => onViewModeChange('thumbs')}
                                    title="Thumbs View"
                                >
                                    <Grid className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0"
                                    onClick={() => onViewModeChange('compact')}
                                    title="Compact View"
                                >
                                    <LayoutGrid className="h-4 w-4" />
                                </Button>
                            </div>

                            {embedded && post?.id && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-muted-foreground hover:text-primary"
                                    onClick={() => window.open(`/post/${post.id}`, '_blank')}
                                    title="Open in full page"
                                >
                                    <ExternalLink className="h-4 w-4" />
                                </Button>
                            )}

                            <ExportDropdown
                                post={isEditMode ? localPost || null : post || null}
                                mediaItems={isEditMode ? (localMediaItems as any) || [] : mediaItems}
                                authorProfile={authorProfile}
                                onExportMarkdown={() => onExportMarkdown('raw')}
                            />

                            {isOwner && (
                                <>
                                    <Button variant="ghost" size="sm" onClick={onEditModeToggle} className="h-7 w-7 p-0 text-muted-foreground hover:text-primary" title="Inline Edit">
                                        <Edit3 className="h-4 w-4" />
                                    </Button>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={onEditPost}><Edit3 className="mr-2 h-4 w-4" /><span>Edit Post Wizard</span></DropdownMenuItem>
                                            {onCategoryManagerOpen && <DropdownMenuItem onClick={onCategoryManagerOpen}><FolderTree className="mr-2 h-4 w-4" /><span>Manage Categories</span></DropdownMenuItem>}
                                            <DropdownMenuItem onClick={onDeletePicture} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /><span>Delete this picture</span></DropdownMenuItem>
                                            <DropdownMenuItem onClick={onDeletePost} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /><span>Delete whole post</span></DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
