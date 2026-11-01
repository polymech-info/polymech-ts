import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, MessageCircle, Maximize, Share2, Brush, Trash2, Plus, Map, Edit3, Download, MoreVertical, FilePlus, FolderInput } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import MagicWizardButton from "@/components/MagicWizardButton";
import PostPicker from "@/components/PostPicker";
import { T, translate } from "@/i18n";
import { PostMediaItem } from "../../types";
import { useWizardContext } from "@/hooks/useWizardContext";
import { updatePicture } from "@/modules/posts/client-pictures";

interface CompactActionToolbarProps {
    item: PostMediaItem;
    isLiked: boolean;
    onLike: () => void;
    isCommentsOpen: boolean;
    onToggleComments: () => void;
    isVideo: boolean;
    onExpand: (item: PostMediaItem) => void;
    isOwner: boolean;
    setShowImageEditor: (show: boolean) => void;
    onDeletePicture: () => void;
    onAddAfter: () => void;
    onEditPicture: () => void;
    onDownload: () => void;
    post?: any; // For MagicWizardButton
    orgSlug?: string;
    className?: string;
    buttonSize?: "default" | "sm" | "lg" | "icon";
    embedded?: boolean;
}

export const CompactActionToolbar: React.FC<CompactActionToolbarProps> = ({
    item,
    isLiked,
    onLike,
    isCommentsOpen,
    onToggleComments,
    isVideo,
    onExpand,
    isOwner,
    setShowImageEditor,
    onDeletePicture,
    onAddAfter,
    onEditPicture,
    onDownload,
    post,
    orgSlug,
    className,
    buttonSize = "default",
    embedded
}) => {
    const navigate = useNavigate();
    const [showMoveDialog, setShowMoveDialog] = useState(false);

    // In embedded mode (like List View), we want to use the collapsed menu even on desktop
    // because the width is constrained.
    const showFullToolbar = !embedded;
    const { setWizardImage, setCreationWizardOpen } = useWizardContext();

    const handleCreatePage = (e: React.MouseEvent) => {
        e.stopPropagation();

        // Set the image for the wizard
        setWizardImage({
            id: item.id,
            src: item.image_url,
            title: item.title,
            realDatabaseId: item.id,
            selected: true
        });

        // Open the global creation wizard in page mode
        setCreationWizardOpen(true, 'page');
    };

    const handleMoveToPost = async (targetPostId: string) => {
        try {
            const rootId = item.parent_id || item.id;
            await updatePicture(rootId, { post_id: targetPostId } as any);
            setShowMoveDialog(false);
            navigate((orgSlug ? `/org/${orgSlug}` : '') + `/post/${targetPostId}`);
        } catch (err) {
            console.error('Failed to move picture:', err);
        }
    };

    return (
        <div className={`flex items-center justify-between ${className}`}>
            {/* Always Visible: Engagement Group */}
            <div className="flex items-center gap-1">
                <Button
                    variant="ghost"
                    size={buttonSize}
                    onClick={() => { onLike(); }}
                    className={isLiked ? "text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30" : "text-pink-500/70 hover:text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-950/30"}
                    title="Like"
                >
                    <Heart className="h-5 w-5" fill={isLiked ? "currentColor" : "none"} />
                </Button>
                <Button
                    variant="ghost"
                    size={buttonSize}
                    onClick={onToggleComments}
                    className={isCommentsOpen ? "text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30" : "text-blue-500/70 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30"}
                    title="Comments"
                >
                    <MessageCircle className="h-5 w-5" />
                </Button>
                <Button
                    variant="ghost"
                    size={buttonSize}
                    className="text-indigo-500/70 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
                    title="Share"
                >
                    <Share2 className="h-5 w-5" />
                </Button>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-1">

                {/* Desktop: Full Toolbar (Hidden on Mobile OR Embedded) */}
                <div className={`${showFullToolbar ? 'hidden lg:flex' : 'hidden'} items-center gap-1`}>
                    {/* Separator */}
                    <div className="h-4 w-px bg-border mx-1" />

                    {/* Group 2: View / Download */}
                    <Button
                        variant="ghost"
                        size={buttonSize}
                        onClick={onDownload}
                        className="text-emerald-500/70 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                        title="Download"
                    >
                        <Download className="h-5 w-5" />
                    </Button>
                    {!isVideo && (
                        <Button
                            variant="ghost"
                            size={buttonSize}
                            onClick={() => onExpand(item)}
                            className="text-sky-500/70 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/30"
                            title="Fullscreen"
                        >
                            <Maximize className="h-5 w-5" />
                        </Button>
                    )}

                    {/* Group 3: Tools/Owner */}
                    {((!isVideo) || isOwner) && (
                        <>
                            <div className="h-4 w-px bg-border mx-1" />
                            {!isVideo && (
                                <>
                                    <MagicWizardButton
                                        imageUrl={item.image_url}
                                        imageTitle={item.title}
                                        variant="ghost"
                                        size={buttonSize === 'icon' ? 'sm' : 'default'}
                                        editingPostId={post?.isPseudo ? null : post?.id}
                                        pictureId={item.id}
                                    // MagicWizardButton implementation handles its own styles, usually purple/magic color.
                                    />
                                    <Button
                                        variant="ghost"
                                        size={buttonSize}
                                        onClick={() => navigate((orgSlug ? `/org/${orgSlug}` : '') + `/version-map/${item.parent_id || item.id}`)}
                                        className="text-amber-500/70 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                                        title="View version map"
                                    >
                                        <Map className="h-5 w-5" />
                                    </Button>
                                </>
                            )}

                            {!isVideo && (
                                <Button
                                    variant="ghost"
                                    size={buttonSize}
                                    onClick={handleCreatePage}
                                    className="text-pink-500/70 hover:text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-950/30"
                                    title="Create Page from Image"
                                >
                                    <FilePlus className="h-5 w-5" />
                                </Button>
                            )}

                            {isOwner && (
                                <>
                                    {!isVideo && (
                                        <Button
                                            variant="ghost"
                                            size={buttonSize}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setShowImageEditor(true);
                                            }}
                                            className="text-violet-500/70 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/30"
                                            title="Paint / Edit"
                                        >
                                            <Brush className="h-5 w-5" />
                                        </Button>
                                    )}
                                    {!isVideo && (
                                        <Button
                                            variant="ghost"
                                            size={buttonSize}
                                            onClick={onEditPicture}
                                            className="text-blue-500/70 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                                            title={translate('Edit')}
                                        >
                                            <Edit3 className="h-5 w-5" />
                                        </Button>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size={buttonSize}
                                        onClick={onDeletePicture}
                                        className="text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                                        title="Remove picture"
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size={buttonSize}
                                        onClick={onAddAfter}
                                        className="text-green-600/70 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950/30"
                                        title="Add picture after"
                                    >
                                        <Plus className="h-5 w-5" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size={buttonSize}
                                        onClick={() => setShowMoveDialog(true)}
                                        className="text-orange-500/70 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/30"
                                        title="Move to Post"
                                    >
                                        <FolderInput className="h-5 w-5" />
                                    </Button>
                                </>
                            )}
                        </>
                    )}
                </div>

                {/* Mobile: Overflow Menu (Visible on Mobile OR if Embedded) */}
                <div className={`${showFullToolbar ? 'lg:hidden' : ''}`}>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size={buttonSize} className="text-muted-foreground">
                                <MoreVertical className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuItem onClick={onDownload} className="text-emerald-600 focus:text-emerald-700">
                                <Download className="mr-2 h-4 w-4" /> <span>Download</span>
                            </DropdownMenuItem>
                            {!isVideo && (
                                <DropdownMenuItem onClick={() => onExpand(item)} className="text-sky-600 focus:text-sky-700">
                                    <Maximize className="mr-2 h-4 w-4" /> <span>Fullscreen</span>
                                </DropdownMenuItem>
                            )}

                            {/* Tools Section */}
                            {((!isVideo) || isOwner) && (
                                <>
                                    <div className="h-px bg-border my-1" />
                                    {!isVideo && (
                                        <>
                                            <div className="px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 cursor-default flex items-center">
                                                <div className="flex-1 -ml-2">
                                                    <MagicWizardButton
                                                        imageUrl={item.image_url}
                                                        imageTitle={item.title}
                                                        variant="ghost"
                                                        size="sm"
                                                        editingPostId={post?.isPseudo ? null : post?.id}
                                                        pictureId={item.id}
                                                        className="w-full justify-start font-normal h-8 px-2"
                                                    />
                                                </div>
                                            </div>
                                            <DropdownMenuItem onClick={() => navigate((orgSlug ? `/org/${orgSlug}` : '') + `/version-map/${item.parent_id || item.id}`)} className="text-amber-600 focus:text-amber-700">
                                                <Map className="mr-2 h-4 w-4" /> <span>Version Map</span>
                                            </DropdownMenuItem>
                                        </>
                                    )}
                                    <DropdownMenuItem onClick={handleCreatePage} className="text-pink-600 focus:text-pink-700">
                                        <FilePlus className="mr-2 h-4 w-4" /> <span>Create Page</span>
                                    </DropdownMenuItem>
                                    {isOwner && (
                                        <>
                                            {!isVideo && (
                                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setShowImageEditor(true); }} className="text-violet-600 focus:text-violet-700">
                                                    <Brush className="mr-2 h-4 w-4" /> <span>Paint / Edit</span>
                                                </DropdownMenuItem>
                                            )}
                                            {!isVideo && (
                                                <DropdownMenuItem onClick={onEditPicture} className="text-blue-600 focus:text-blue-700">
                                                    <Edit3 className="mr-2 h-4 w-4" /> <span>Edit Metadata</span>
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuItem onClick={onAddAfter} className="text-green-600 focus:text-green-700">
                                                <Plus className="mr-2 h-4 w-4" /> <span>Add Picture</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => setShowMoveDialog(true)} className="text-orange-600 focus:text-orange-700">
                                                <FolderInput className="mr-2 h-4 w-4" /> <span>Move to Post</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={onDeletePicture} className="text-destructive focus:text-destructive">
                                                <Trash2 className="mr-2 h-4 w-4" /> <span>Delete Picture</span>
                                            </DropdownMenuItem>
                                        </>
                                    )}
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Move to Post Dialog */}
            <Dialog open={showMoveDialog} onOpenChange={setShowMoveDialog}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Move to Post</DialogTitle>
                    </DialogHeader>
                    <PostPicker onSelect={handleMoveToPost} />
                </DialogContent>
            </Dialog>
        </div>
    );
};
