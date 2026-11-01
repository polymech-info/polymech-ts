import React, { useState, useEffect } from 'react';
import { apiClient, serverUrl } from "@/lib/db";
import { Link, useNavigate } from "react-router-dom";
import { User as UserIcon, LayoutGrid, StretchHorizontal, FileText, Save, X, Edit3, MoreVertical, Trash2, ArrowUp, ArrowDown, Heart, MessageCircle, Maximize, ImageIcon, Youtube, Music, Wand2, Map, Brush, Mail, Archive } from 'lucide-react';
import { useOrganization } from "@/contexts/OrganizationContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Code } from "lucide-react";
import { T, translate } from "@/i18n";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import Comments from "@/components/Comments";
import MagicWizardButton from "@/components/MagicWizardButton";
import { InlineDropZone } from "@/components/InlineDropZone";
import { Loader2 } from 'lucide-react';
const VidstackPlayer = React.lazy(() => import('@/player/components/VidstackPlayerImpl').then(m => ({ default: m.VidstackPlayerImpl })));
import { PostRendererProps } from '../types';
import { isVideoType, normalizeMediaType } from "@/lib/mediaRegistry";
import { getVideoUrlWithResolution } from "../utils";
import ResponsiveImage from "@/components/ResponsiveImage";
import { generateOfflineZip } from "@/utils/zipGenerator";
import { toast } from "sonner";
// Lazy load ImageEditor
const ImageEditor = React.lazy(() => import("@/components/ImageEditor").then(module => ({ default: module.ImageEditor })));

const CommentCountButton = ({ pictureId, isOpen, onClick }: { pictureId: string, isOpen: boolean, onClick: () => void }) => {
    const [count, setCount] = useState<number | null>(null);

    useEffect(() => {
        const fetchCount = async () => {
            try {
                const data = await apiClient<{ comments: any[] }>(`/api/pictures/${pictureId}/comments`);
                setCount(data.comments?.length ?? null);
            } catch {
                setCount(null);
            }
        };
        fetchCount();
    }, [pictureId]);

    return (
        <Button
            variant="ghost"
            size="sm"
            title={translate('Comment')}
            onClick={onClick}
            className={isOpen ? "text-primary bg-accent/50" : ""}
        >
            <MessageCircle className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Comment {count !== null ? `(${count})` : ''}</span>
        </Button>
    );
};

export const ArticleRenderer: React.FC<PostRendererProps> = (props) => {
    const {
        post, authorProfile, mediaItems, localMediaItems, mediaItem,
        isOwner, isEditMode, isLiked, likesCount, localPost,
        setLocalPost, setLocalMediaItems,
        onEditModeToggle, onEditPost, onViewModeChange, onExportMarkdown, onSaveChanges,
        onDeletePost, onDeletePicture, onLike, onUnlinkImage, onRemoveFromPost, onEditPicture,
        onGalleryPickerOpen, onYouTubeAdd, onTikTokAdd, onAIWizardOpen, onInlineUpload, onMoveItem,
        onMediaSelect, onExpand, onDownload
    } = props;

    const currentItems = isEditMode ? localMediaItems : mediaItems;
    const [openCommentIds, setOpenCommentIds] = useState<Set<string>>(new Set());
    const [editingImageId, setEditingImageId] = useState<string | null>(null);
    const [cacheBustKeys, setCacheBustKeys] = React.useState<Record<string, number>>({});
    const [isEmbedDialogOpen, setIsEmbedDialogOpen] = useState(false);
    const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
    const [isZipping, setIsZipping] = useState(false);
    const navigate = useNavigate();
    const { orgSlug } = useOrganization();

    const baseUrl = serverUrl || window.location.origin;
    const embedUrl = `${baseUrl}/embed/${post?.id || mediaItem.id}`;
    const embedCode = `<iframe src="${embedUrl}" width="100%" height="600" frameborder="0"></iframe>`;
    const [emailHtml, setEmailHtml] = useState('');
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

    const loadEmailHtml = async () => {
        if (!post?.id) return;
        try {
            const res = await fetch(`${baseUrl}/api/render/email/${post.id}`);
            if (res.ok) {
                const html = await res.text();
                setEmailHtml(html);
            }
        } catch (e) {
            console.error("Failed to load email html", e);
        }
    };

    useEffect(() => {
        if (mediaItem && !isEditMode) {
            const element = document.getElementById(`media-item-${mediaItem.id}`);
            if (element) {
                //    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [mediaItem?.id, isEditMode]);

    return (
        <div className="container mx-auto px-4 py-8 max-w-3xl">
            {/* Header */}
            <div className="mb-8 border-b pb-8">
                <div className="flex items-center justify-between mb-6">
                    <Link
                        to={`/user/${mediaItem.user_id}`}
                        className="flex items-center gap-3 group"
                    >
                        <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center overflow-hidden">
                            {authorProfile?.avatar_url ? (
                                <ResponsiveImage
                                    src={authorProfile.avatar_url}
                                    alt="Avatar"
                                    imgClassName="w-full h-full object-cover"
                                    sizes="50px"
                                    loading="lazy"
                                />
                            ) : (
                                <UserIcon className="h-6 w-6 text-white" />
                            )}
                        </div>
                        <div>
                            <div className="font-semibold text-lg group-hover:underline">
                                {authorProfile?.display_name || `User ${mediaItem.user_id.slice(0, 8)}`}
                            </div>
                            <div className="text-sm text-muted-foreground mr-4">
                                {new Date(post?.created_at || mediaItem.created_at).toLocaleDateString(undefined, {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </div>
                        </div>
                    </Link>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        <div className="flex items-center bg-muted/50 rounded-lg p-1 mr-2 border">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => onViewModeChange('compact')}
                                title="Compact View"
                            >
                                <LayoutGrid className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                className="h-8 w-8 p-0"
                                title="Article View"
                            >
                                <StretchHorizontal className="h-4 w-4" />
                            </Button>
                        </div>

                        <Button variant="outline" size="sm" onClick={onExportMarkdown} title={translate('Export to Markdown')}>
                            <FileText className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline"><T>Export MD</T></span>
                        </Button>

                        <Button variant="outline" size="sm" onClick={() => setIsEmbedDialogOpen(true)} title={translate('Embed')}>
                            <Code className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline"><T>Embed</T></span>
                        </Button>

                        <Button variant="outline" size="sm" onClick={() => setIsEmailDialogOpen(true)} title={translate('As Email')}>
                            <Mail className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline"><T>As Email</T></span>
                        </Button>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                                if (!post?.id) return;
                                setIsGeneratingPdf(true);
                                toast.info("Downloading PDF...");
                                try {
                                    // Trigger download via link
                                    const link = document.createElement('a');
                                    link.href = `${baseUrl}/api/render/pdf/${post.id}`;
                                    link.download = `${post.title || 'export'}.pdf`; // Optional, server sets disposition
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                    toast.success("Download started!");
                                } catch (e) {
                                    console.error(e);
                                    toast.error("Failed to download PDF");
                                } finally {
                                    setIsGeneratingPdf(false);
                                }
                            }}
                            disabled={isGeneratingPdf}
                            title={translate('Export PDF')}
                        >
                            <span className="hidden sm:inline"><T>{isGeneratingPdf ? 'Generating...' : 'Export PDF'}</T></span>
                        </Button>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                                setIsZipping(true);
                                toast.info("Generating ZIP... this may take a moment.");
                                try {
                                    await generateOfflineZip(post || localPost, currentItems, authorProfile?.display_name || 'Author');
                                    toast.success("ZIP downloaded!");
                                } catch (e) {
                                    console.error(e);
                                    toast.error("Failed to generate ZIP");
                                } finally {
                                    setIsZipping(false);
                                }
                            }}
                            disabled={isZipping}
                            title={translate('Download ZIP')}
                        >
                            <Archive className={`h-4 w-4 sm:mr-2 ${isZipping ? 'animate-pulse' : ''}`} />
                            <span className="hidden sm:inline"><T>{isZipping ? 'Zipping...' : 'Download ZIP'}</T></span>
                        </Button>

                        {/* Owner Actions */}
                        {isOwner && (
                            <>
                                <div className="h-6 w-px bg-border mx-1" />

                                {isEditMode ? (
                                    <div className="flex items-center gap-2">
                                        <Button size="sm" variant="default" onClick={onSaveChanges} className="gap-2" title={translate('Save')}>
                                            <Save className="h-4 w-4" />
                                            <span className="hidden sm:inline"><T>Save</T></span>
                                        </Button>
                                        <Button size="sm" variant="ghost" onClick={onEditModeToggle} className="gap-2" title={translate('Cancel')}>
                                            <X className="h-4 w-4" />
                                            <span className="hidden sm:inline"><T>Cancel</T></span>
                                        </Button>
                                    </div>
                                ) : (
                                    <>
                                        <Button variant="outline" size="sm" onClick={onEditModeToggle} className={isEditMode ? "bg-accent" : ""} title={translate('Edit Mode')}>
                                            <Edit3 className="h-4 w-4 sm:mr-2" />
                                            <span className="hidden sm:inline"><T>Edit Mode</T></span>
                                        </Button>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={onEditPost} className="">
                                                    <Edit3 className="mr-2 h-4 w-4" />
                                                    <span><T>Edit Meta Wizard</T></span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={onDeletePost} className="text-destructive">
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    <span><T>Delete Post</T></span>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Title & Description */}
                {isEditMode ? (
                    <div className="space-y-4 mb-8 p-4 border rounded-lg bg-muted/30">
                        <Input
                            value={localPost?.title || ''}
                            onChange={(e) => setLocalPost((prev: any) => ({ ...(prev || { description: '' }), title: e.target.value }))}
                            className="text-4xl font-bold tracking-tight h-auto py-2 bg-background"
                            placeholder="Post Title"
                        />
                        <Textarea
                            value={localPost?.description || ''}
                            onChange={(e) => setLocalPost((prev: any) => ({ ...(prev || { title: '' }), description: e.target.value }))}
                            className="text-lg bg-background"
                            placeholder="Post Description (Markdown supported)"
                            rows={4}
                        />
                    </div>
                ) : (
                    <>
                        <h1 className="text-4xl font-bold tracking-tight mb-4">{post?.title || mediaItem.title}</h1>
                        {(post?.description || (!post?.title && mediaItem.description)) && (
                            <div className="prose prose-lg dark:prose-invert max-w-none text-muted-foreground">
                                <MarkdownRenderer content={post?.description || mediaItem.description || ''} />
                            </div>
                        )}
                    </>
                )}

                {/* Tagline / Subtitle if any */}
                {post?.title && post.title !== mediaItem.title && mediaItem.title && (
                    <div className="mt-4 text-xl font-medium text-muted-foreground">
                        {mediaItem.title}
                    </div>
                )}
            </div>

            {/* Media Content - Stacked */}
            <div className="space-y-12">
                {currentItems.map((item, index) => {
                    const itemIsVideo = isVideoType(normalizeMediaType(item.type));
                    const itemVideoUrl = (itemIsVideo && item.image_url) ? getVideoUrlWithResolution(item.image_url) : undefined;

                    return (
                        <div key={item.id} id={`media-item-${item.id}`} className="space-y-4 relative">
                            {/* Reorder Controls - Desktop Sidebar */}
                            {isEditMode && (
                                <div className="absolute -left-12 top-0 flex flex-col gap-1 z-10 hidden lg:flex">
                                    <Button size="icon" variant="outline" onClick={() => onMoveItem(index, 'up')} disabled={index === 0}>
                                        <ArrowUp className="h-4 w-4" />
                                    </Button>
                                    <Button size="icon" variant="outline" onClick={() => onMoveItem(index, 'down')} disabled={index === currentItems.length - 1}>
                                        <ArrowDown className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}

                            <div className="overflow-hidden rounded-xl border bg-muted/30 shadow-sm relative group">
                                {/* Mobile Reorder Overlay */}
                                {isEditMode && (
                                    <div className="absolute top-2 right-2 z-20 flex gap-2 lg:hidden">
                                        <Button size="icon" variant="secondary" onClick={() => onMoveItem(index, 'up')} disabled={index === 0} className="h-8 w-8">
                                            <ArrowUp className="h-4 w-4" />
                                        </Button>
                                        <Button size="icon" variant="secondary" onClick={() => onMoveItem(index, 'down')} disabled={index === currentItems.length - 1} className="h-8 w-8">
                                            <ArrowDown className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}

                                {itemIsVideo ? (
                                    item.type === 'tiktok' ? (
                                        <div className="aspect-[9/16] max-h-[80vh] mx-auto bg-black flex justify-center">
                                            <iframe
                                                src={item.image_url}
                                                className="w-full h-full border-0"
                                                allow="encrypted-media;"
                                                title={item.title}
                                            ></iframe>
                                        </div>
                                    ) : (
                                        <div className="aspect-video">
                                            <React.Suspense fallback={<div className="w-full h-full bg-black flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-white" /></div>}>
                                                <VidstackPlayer
                                                    title={item.title}
                                                    src={itemVideoUrl}
                                                    poster={item.thumbnail_url}
                                                    className="w-full h-full"
                                                    controls
                                                    playsInline
                                                />
                                            </React.Suspense>
                                        </div>
                                    )
                                ) : (
                                    <ResponsiveImage
                                        src={`${item.image_url}${cacheBustKeys[item.id] ? `?v=${cacheBustKeys[item.id]}` : ''}`}
                                        alt={item.title}
                                        imgClassName="w-full h-auto object-cover cursor-pointer"
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                                        loading="lazy"
                                        onClick={() => {
                                            if (!isEditMode) {
                                                onMediaSelect(item);
                                                onExpand(item);
                                            }
                                        }}
                                    />
                                )}
                            </div>

                            {editingImageId === item.id && (
                                <div className="fixed inset-0 z-50 bg-background flex flex-col">
                                    <React.Suspense fallback={<div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
                                        <ImageEditor
                                            imageUrl={item.image_url}
                                            pictureId={item.id}
                                            onClose={() => setEditingImageId(null)}
                                            onSave={() => {
                                                setCacheBustKeys(prev => ({ ...prev, [item.id]: Date.now() }));
                                                setEditingImageId(null);
                                                onLike(); // Trigger refresh
                                            }}
                                        />
                                    </React.Suspense>
                                </div>
                            )}

                            {/* Inline Inputs for Caption */}
                            {isEditMode ? (
                                <div className="px-1 border-l-2 border-primary/20 pl-4 py-1 space-y-2">
                                    <Input
                                        value={item.title || ''}
                                        onChange={(e) => {
                                            const newItems = [...localMediaItems];
                                            newItems[index] = { ...newItems[index], title: e.target.value };
                                            setLocalMediaItems(newItems);
                                        }}
                                        placeholder="Image Title"
                                        className="font-semibold text-lg"
                                    />
                                    <Textarea
                                        value={item.description || ''}
                                        onChange={(e) => {
                                            const newItems = [...localMediaItems];
                                            newItems[index] = { ...newItems[index], description: e.target.value };
                                            setLocalMediaItems(newItems);
                                        }}
                                        placeholder="Image Description"
                                        className=""
                                        rows={2}
                                    />
                                </div>
                            ) : (
                                /* Item Description / Caption (View Mode) */
                                (item.description || item.title) && (item.description !== post?.description) && (
                                    <div className="px-1 border-l-2 border-primary/20 pl-4 py-1">
                                        {item.title && item.title !== post?.title && (
                                            <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
                                        )}
                                        {item.description && (
                                            <MarkdownRenderer
                                                content={item.description}
                                                className="prose text-foreground/80 italic"
                                            />
                                        )}
                                    </div>
                                )
                            )}

                            {/* Edit Mode Actions */}
                            {isEditMode && (
                                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                                    <Button variant="destructive" size="sm" onClick={() => onRemoveFromPost(index)}>
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        <T>Remove</T>
                                    </Button>
                                </div>
                            )}

                            {/* User Interactions per image (View Mode Only) */}
                            {!isEditMode && (
                                <div className="flex flex-col gap-4">
                                    <div className="flex items-center gap-2 sm:gap-4 text-sm text-muted-foreground overflow-x-auto scrollbar-hide w-full p-1">
                                        <Button variant="ghost" size="sm" onClick={() => { onMediaSelect(item); onLike(); }} className={item.id === mediaItem?.id && isLiked ? "text-red-500" : ""} title={translate('Like')}>
                                            <Heart className="h-4 w-4 mr-2" fill={item.id === mediaItem?.id && isLiked ? "currentColor" : "none"} />
                                            {item.likes_count}
                                        </Button>
                                        <CommentCountButton
                                            pictureId={item.id}
                                            isOpen={openCommentIds.has(item.id)}
                                            onClick={() => {
                                                const newSet = new Set(openCommentIds);
                                                if (newSet.has(item.id)) {
                                                    newSet.delete(item.id);
                                                } else {
                                                    newSet.add(item.id);
                                                }
                                                setOpenCommentIds(newSet);
                                            }}
                                        />

                                        {!itemIsVideo && (
                                            <>
                                                <MagicWizardButton
                                                    imageUrl={item.image_url}
                                                    imageTitle={item.title}
                                                    variant="ghost"
                                                    size="sm"
                                                    editingPostId={post?.isPseudo ? null : post?.id}
                                                    pictureId={item.id}
                                                >
                                                    <span className="hidden sm:inline">AI Wizard</span>
                                                </MagicWizardButton>
                                                <Button variant="ghost" size="sm" onClick={() => navigate((orgSlug ? `/org/${orgSlug}` : '') + `/version-map/${item.parent_id || item.id}`)} title="View version map">
                                                    <Map className="h-4 w-4 sm:mr-2" />
                                                    <span className="hidden sm:inline">Map</span>
                                                </Button>
                                            </>
                                        )}
                                        <Button variant="ghost" size="sm" onClick={() => { onMediaSelect(item); onExpand(item); }} title={translate('Expand')}>
                                            <Maximize className="h-4 w-4 sm:mr-2" />
                                            <span className="hidden sm:inline">Expand</span>
                                        </Button>

                                        {isOwner && !itemIsVideo && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setEditingImageId(item.id)}
                                                className="gap-2"
                                                title={translate('Paint / Edit')}
                                            >
                                                <Brush className="h-4 w-4 sm:mr-2" />
                                                <span className="hidden sm:inline"><T>Paint</T></span>
                                            </Button>
                                        )}

                                        {isOwner && (
                                            <>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        onMediaSelect(item);
                                                        setTimeout(() => onEditPicture(), 0);
                                                    }}
                                                    className="text-muted-foreground hover:text-primary"
                                                    title={translate('Edit')}
                                                >
                                                    <Edit3 className="h-4 w-4 sm:mr-2" />
                                                    <span className="hidden sm:inline"><T>Edit</T></span>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => onUnlinkImage(item)}
                                                    className="text-muted-foreground hover:text-destructive"
                                                    title={translate('Remove from post')}
                                                >
                                                    <Trash2 className="h-4 w-4 sm:mr-2" />
                                                    <span className="hidden sm:inline"><T>Remove</T></span>
                                                </Button>
                                            </>
                                        )}
                                    </div>



                                    {/* Inline Comments */}
                                    {openCommentIds.has(item.id) && (
                                        <div className="pt-4 border-t animate-in slide-in-from-top-2 fade-in duration-200">
                                            <Comments pictureId={item.id} initialComments={item.comments} />
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Insert Media Drop Zone */}
                            {isEditMode && (
                                <div className="flex flex-col gap-2">
                                    <InlineDropZone
                                        index={index}
                                        onDrop={(files) => onInlineUpload(files, index + 1)}
                                    />
                                    <div className="flex gap-2 justify-center">
                                        <Button variant="outline" size="sm" onClick={() => onGalleryPickerOpen(index + 1)}>
                                            <ImageIcon className="h-4 w-4 mr-2" />
                                            <T>From Gallery</T>
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={onYouTubeAdd}>
                                            <Youtube className="h-4 w-4 mr-2 text-red-600" />
                                            <T>YouTube</T>
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={onTikTokAdd}>
                                            <Music className="h-4 w-4 mr-2 text-pink-500" />
                                            <T>TikTok</T>
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            onAIWizardOpen(index + 1);
                                        }}>
                                            <Wand2 className="h-4 w-4 mr-2" />
                                            <T>AI Wizard</T>
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <Dialog open={isEmbedDialogOpen} onOpenChange={setIsEmbedDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Embed Post</DialogTitle>
                        <DialogDescription>
                            Copy the code below to embed this post on your website.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="p-4 bg-muted rounded-md relative group">
                            <code className="text-sm break-all font-mono">{embedCode}</code>
                            <Button
                                size="sm"
                                variant="secondary"
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => navigator.clipboard.writeText(embedCode)}
                            >
                                Copy
                            </Button>
                        </div>
                        <div className="text-xs text-muted-foreground">
                            Preview:
                            <div className="mt-2 border rounded overflow-hidden aspect-video relative">
                                <iframe src={embedUrl} width="100%" height="100%" frameBorder="0" className="absolute inset-0" />
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isEmailDialogOpen} onOpenChange={(open) => {
                setIsEmailDialogOpen(open);
                if (open) loadEmailHtml();
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Export as Email</DialogTitle>
                        <DialogDescription>
                            Copy the HTML below to use in your email marketing tool.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="p-4 bg-muted rounded-md relative group h-64 overflow-y-auto">
                            <code className="text-xs break-all font-mono whitespace-pre-wrap">{emailHtml || 'Loading...'}</code>
                            <Button
                                size="sm"
                                variant="secondary"
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => navigator.clipboard.writeText(emailHtml)}
                            >
                                Copy
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};
