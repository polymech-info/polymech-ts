import React, { useRef } from 'react';
import { ImageFile } from '@/components/ImageWizard/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, ArrowUp, ArrowDown, Plus, Bookmark, Settings2, ChevronDown } from 'lucide-react';
import { T, translate } from '@/i18n';
import AddToCollectionModal from '@/components/AddToCollectionModal';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PostComposerProps {
    images: ImageFile[];
    setImages: React.Dispatch<React.SetStateAction<ImageFile[]>>;
    onRemoveImage: (id: string) => void;
    onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
    dropZoneRef: React.RefObject<HTMLDivElement>;
    isDragging: boolean;
    onDragEnter: (e: React.DragEvent<HTMLDivElement>) => void;
    onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
    onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
    onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
    postTitle: string;
    setPostTitle: (value: string) => void;
    postDescription: string;
    setPostDescription: (value: string) => void;
    onPublish: () => void;
    onPublishToGallery?: () => void;
    onAppendToPost?: () => void;
    isPublishing: boolean;
    isEditing?: boolean;
    postId?: string;
    settings: any;
    setSettings: (settings: any) => void;
}

const ImageItem = ({
    image,
    index,
    total,
    onUpdate,
    onRemove,
    onMove
}: {
    image: ImageFile;
    index: number;
    total: number;
    onUpdate: (id: string, field: 'title' | 'description', value: string) => void;
    onRemove: (id: string) => void;
    onMove: (index: number, direction: 'up' | 'down') => void;
}) => {
    return (
        <div className="flex flex-col sm:flex-row gap-4 p-4 bg-muted/40 rounded-lg border group animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-start gap-4">
                {/* Reorder Controls */}
                <div className="flex flex-col gap-1 justify-center h-32">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onMove(index, 'up')}
                        disabled={index === 0}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground disabled:opacity-30"
                        title="Move Up"
                    >
                        <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onMove(index, 'down')}
                        disabled={index === total - 1}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground disabled:opacity-30"
                        title="Move Down"
                    >
                        <ArrowDown className="h-4 w-4" />
                    </Button>
                </div>

                {/* Thumbnail */}
                <div className="w-32 h-32 flex-shrink-0 bg-background rounded-md overflow-hidden border relative">
                    {image.type === 'video' ? (
                        image.uploadStatus === 'ready' ? (
                            <>
                                <img
                                    src={image.src}
                                    alt={image.title}
                                    className="w-full h-full object-cover"
                                    draggable={false}
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                    <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center">
                                        <svg className="w-4 h-4 text-black ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-muted">
                                {image.uploadStatus === 'error' ? (
                                    <span className="text-destructive text-xs text-center p-1"><T>Upload Failed</T></span>
                                ) : (
                                    <>
                                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2" />
                                        <span className="text-xs text-muted-foreground">{image.uploadProgress}%</span>
                                    </>
                                )}
                            </div>
                        )
                    ) : (
                        <img
                            src={image.src}
                            alt={image.title}
                            className="w-full h-full object-cover"
                            draggable={false}
                        />
                    )}
                </div>

                {/* Actions - Mobile */}
                <div className="sm:hidden flex flex-col gap-2 ml-auto">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onRemove(image.id)}
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        title="Remove"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Inputs */}
            <div className="flex-1 space-y-3 w-full">
                <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground"><T>Title</T></label>
                    <Input
                        value={image.title}
                        onChange={(e) => onUpdate(image.id, 'title', e.target.value)}
                        className="h-9 w-full"
                        placeholder="Image title..."
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground"><T>Caption / Description</T></label>
                    <Textarea
                        value={image.description || ''}
                        onChange={(e) => onUpdate(image.id, 'description', e.target.value)}
                        className="min-h-[60px] resize-none text-sm w-full"
                        placeholder="Add a caption..."
                    />
                </div>
            </div>

            {/* Actions - Desktop */}
            <div className="hidden sm:flex flex-col gap-2">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemove(image.id)}
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    title="Remove"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
};

export const PostComposer: React.FC<PostComposerProps> = ({
    images,
    setImages,
    onRemoveImage,
    onFileUpload,
    dropZoneRef,
    isDragging,
    onDragEnter,
    onDragOver,
    onDragLeave,
    onDrop,
    postTitle,
    setPostTitle,
    postDescription,
    setPostDescription,
    onPublish,
    onPublishToGallery,
    onAppendToPost,
    isPublishing,
    isEditing = false,
    postId,
    settings,
    setSettings
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showCollectionModal, setShowCollectionModal] = React.useState(false);

    const handleUpdateImage = (id: string, field: 'title' | 'description', value: string) => {
        setImages(prev => prev.map(img =>
            img.id === id ? { ...img, [field]: value } : img
        ));
    };

    const handleMoveImage = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index > 0) {
            setImages(prev => {
                const newImages = [...prev];
                const temp = newImages[index];
                newImages[index] = newImages[index - 1];
                newImages[index - 1] = temp;
                return newImages;
            });
        } else if (direction === 'down' && index < images.length - 1) {
            setImages(prev => {
                const newImages = [...prev];
                const temp = newImages[index];
                newImages[index] = newImages[index + 1];
                newImages[index + 1] = temp;
                return newImages;
            });
        }
    };

    return (
        <div className="h-full flex flex-col gap-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b gap-3">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button onClick={() => fileInputRef.current?.click()} size="sm" variant="outline" disabled={isPublishing} className="flex-1 sm:flex-none">
                        <Plus className="h-4 w-4 mr-2 shrink-0" />
                        <T>Add Images</T>
                    </Button>
                    {isEditing && postId && (
                        <Button
                            onClick={() => setShowCollectionModal(true)}
                            size="sm"
                            variant="outline"
                            className="text-muted-foreground hover:text-primary flex-1 sm:flex-none"
                        >
                            <Bookmark className="h-4 w-4 mr-2 shrink-0" />
                            <T>Collections</T>
                        </Button>
                    )}
                </div>
                <div className="flex rounded-md shadow-sm w-full sm:w-auto">
                    <Button
                        onClick={onPublish}
                        size="sm"
                        disabled={isPublishing || images.length === 0}
                        className="rounded-r-none flex-1 sm:flex-none"
                    >
                        {isPublishing ? (
                            <>
                                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                <T>{isEditing ? "Updating..." : "Publishing..."}</T>
                            </>
                        ) : (
                            <>
                                <T>{isEditing ? "Update Post" : "Quick Publish (Default)"}</T>
                            </>
                        )}
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button size="sm" className="rounded-l-none border-l border-primary-foreground/20 px-2" disabled={isPublishing || images.length === 0}>
                                <ChevronDown className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={onPublish}>
                                <T>Quick Publish (Default)</T>
                            </DropdownMenuItem>
                            {onPublishToGallery && (
                                <DropdownMenuItem onClick={onPublishToGallery}>
                                    <T>Publish as Picture</T>
                                </DropdownMenuItem>
                            )}
                            {onAppendToPost && !isEditing && (
                                <DropdownMenuItem onClick={onAppendToPost}>
                                    <T>Append to Existing Post</T>
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Post Metadata */}
            <div className="grid grid-cols-1 gap-4 p-4 bg-muted/20 rounded-lg border">
                <div className="space-y-2">
                    <label className="text-sm font-medium"><T>Post Title</T></label>
                    <Input
                        value={postTitle}
                        onChange={(e) => setPostTitle(e.target.value)}
                        placeholder={translate("My Awesome Post")}
                        className="font-medium"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium"><T>Post Description (Markdown)</T></label>
                    <Textarea
                        value={postDescription}
                        onChange={(e) => setPostDescription(e.target.value)}
                        placeholder={translate("Describe your post... Supports **bold**, *italic*, lists, etc.")}
                        className="min-h-[80px]"
                    />
                </div>
            </div>

            {/* Settings Section */}
            <Accordion type="single" collapsible className="w-full bg-muted/20 rounded-lg border px-4">
                <AccordionItem value="settings" className="border-0">
                    <AccordionTrigger className="hover:no-underline py-3">
                        <div className="flex items-center gap-2 text-sm font-medium">
                            <Settings2 className="h-4 w-4" />
                            <T>Post Settings & Visibility</T>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4 pt-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                            <div className="space-y-2">
                                <label className="text-sm font-medium"><T>Visibility</T></label>
                                <Select
                                    value={settings?.visibility || 'public'}
                                    onValueChange={(value) => setSettings({ ...settings, visibility: value })}
                                >
                                    <SelectTrigger className="bg-background">
                                        <SelectValue placeholder="Select visibility" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="public"><T>Public (Everyone)</T></SelectItem>
                                        <SelectItem value="listed"><T>Listed (Unlisted link)</T></SelectItem>
                                        <SelectItem value="private"><T>Private (Only Me)</T></SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">
                                    {settings?.visibility === 'public' && <T>Visible to everyone on the homepage and profile.</T>}
                                    {settings?.visibility === 'listed' && <T>Accessible only via direct link. Not shown on homepage.</T>}
                                    {settings?.visibility === 'private' && <T>Only you can see this post.</T>}
                                </p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium"><T>Display Mode</T></label>
                                <Select
                                    value={settings?.display || 'compact'}
                                    onValueChange={(value) => setSettings({ ...settings, display: value })}
                                >
                                    <SelectTrigger className="bg-background">
                                        <SelectValue placeholder="Select display mode" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="compact"><T>Compact (Standard)</T></SelectItem>
                                        <SelectItem value="article"><T>Article (Blog Style)</T></SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">
                                    {(settings?.display === 'compact' || !settings?.display) && <T>Standard view with side panel.</T>}
                                    {settings?.display === 'article' && <T>Wide layout with large images and inline text.</T>}
                                </p>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>

            {/* Main Content Area */}
            <div
                ref={dropZoneRef}
                onDragEnter={onDragEnter}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                className={`space-y-4 pr-2 min-h-[200px] transition-colors rounded-lg ${isDragging ? 'bg-primary/5 ring-2 ring-primary ring-inset' : ''}`}
            >
                {images.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg text-muted-foreground min-h-[200px]">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                            <Plus className="h-8 w-8 opacity-50" />
                        </div>
                        <h3 className="text-lg font-medium mb-1"><T>No images added yet</T></h3>
                        <p className="text-sm mb-4"><T>Drag and drop images here or click Add Images</T></p>
                        <Button onClick={() => fileInputRef.current?.click()} variant="outline">
                            <T>Select Files</T>
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {images.map((image, index) => (
                            <ImageItem
                                key={image.id}
                                image={image}
                                index={index}
                                total={images.length}
                                onUpdate={handleUpdateImage}
                                onRemove={onRemoveImage}
                                onMove={handleMoveImage}
                            />
                        ))}
                    </div>
                )}
            </div>

            <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*,.jpeg,.jpg,.png,.gif,.webp,.mp4,.webm,.mov,.qt,.m4v"
                className="hidden"
                onChange={onFileUpload}
            />

            {
                isEditing && postId && (
                    <AddToCollectionModal
                        isOpen={showCollectionModal}
                        onClose={() => setShowCollectionModal(false)}
                        postId={postId}
                    />
                )
            }
        </div >
    );
};
