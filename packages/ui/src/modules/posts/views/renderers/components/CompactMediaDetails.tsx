import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import Comments from "@/components/Comments";
import { ExternalLink } from "lucide-react";
import { CompactActionToolbar } from "./CompactActionToolbar";
import { PostMediaItem } from "../../types";

interface CompactMediaDetailsProps {
    isEditMode: boolean;
    localMediaItems?: PostMediaItem[];
    setLocalMediaItems?: (items: PostMediaItem[]) => void;
    mediaItem: PostMediaItem;
    versionImages: any[]; // Adjust type if possible
    isLiked: boolean;
    likesCount: number;
    onLike: () => void;
    onExpand: (item: PostMediaItem) => void;
    isOwner: boolean;
    setShowImageEditor: (show: boolean) => void;
    onDeletePicture: () => void;
    onAddAfter: () => void;
    onEditPicture: () => void;
    onDownload: () => void;
    isVideo: boolean;
    post?: any;
    orgSlug?: string;
    embedded?: boolean;
}

export const CompactMediaDetails: React.FC<CompactMediaDetailsProps> = ({
    isEditMode,
    localMediaItems,
    setLocalMediaItems,
    mediaItem,
    versionImages,
    isLiked,
    likesCount,
    onLike,
    onExpand,
    isOwner,
    setShowImageEditor,
    onDeletePicture,
    onAddAfter,
    onEditPicture,
    onDownload,
    isVideo,
    post,
    orgSlug,
    embedded
}) => {
    // Media Title/Desc Logic
    return (
        <>
            {isEditMode ? (
                <div className="px-3 pb-2 space-y-2">
                    <Input
                        value={localMediaItems?.find(i => i.id === mediaItem.id)?.title || ''}
                        onChange={(e) => {
                            if (!setLocalMediaItems || !localMediaItems) return;
                            const newItems = localMediaItems.map(item =>
                                item.id === mediaItem.id ? { ...item, title: e.target.value } : item
                            );
                            setLocalMediaItems(newItems);
                        }}
                        className="font-semibold"
                        placeholder="Image Title"
                    />
                    <Textarea
                        value={localMediaItems?.find(i => i.id === mediaItem.id)?.description || ''}
                        onChange={(e) => {
                            if (!setLocalMediaItems || !localMediaItems) return;
                            const newItems = localMediaItems.map(item =>
                                item.id === mediaItem.id ? { ...item, description: e.target.value } : item
                            );
                            setLocalMediaItems(newItems);
                        }}
                        className="text-sm"
                        placeholder="Image Description"
                    />
                </div>
            ) : (
                <>
                    {(mediaItem.title || (versionImages.find(v => v.path === mediaItem.id)?.title)) && (
                        <div className="px-3 pb-2">
                            <h1 className="text-base font-semibold">{mediaItem.title}</h1>
                        </div>
                    )}
                    <div className="p-3">
                        {mediaItem.description && <MarkdownRenderer content={mediaItem.description} className="prose-sm text-sm" />}
                    </div>
                </>
            )}

            {/* External Link for Link Posts */}
            {(mediaItem.type === 'page-external' || (mediaItem.meta as any)?.url) && (
                <div className="px-3 pb-2">
                    <a
                        href={(mediaItem.meta as any)?.url || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-blue-500 dark:text-blue-400 hover:scale-[1.01] active:scale-[0.99] transition-transform bg-blue-50/50 dark:bg-blue-900/20 p-2 rounded-md border border-blue-100 dark:border-blue-800 max-w-full"
                        onClick={(e) => e.stopPropagation()}
                        title={(mediaItem.meta as any)?.url}
                    >
                        <ExternalLink className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate hover:underline">{(mediaItem.meta as any)?.url}</span>
                    </a>
                </div>
            )}

            {/* Actions Footer */}
            <div className="p-3 border-t">
                <CompactActionToolbar
                    item={mediaItem}
                    isLiked={isLiked}
                    onLike={onLike}
                    isCommentsOpen={false} // Always show comments below, so toggle logic might not differ, or we don't need button to toggle?
                    // Original code: <Button ... onClick={() => {}} ><MessageCircle /></Button> (No toggle logic in desktop view, implies comments always visible or button just scrolls?)
                    // Line 834: <Button variant="ghost" size="default"><MessageCircle className="h-6 w-6" /></Button> (No onClick)
                    // Line 903: <Comments pictureId={mediaItem.id} /> (Always rendered)
                    // So button is just visual or potentially scroll to comments.
                    onToggleComments={() => { }}
                    isVideo={isVideo}
                    onExpand={onExpand}
                    isOwner={isOwner}
                    setShowImageEditor={setShowImageEditor}
                    onDeletePicture={onDeletePicture}
                    onAddAfter={onAddAfter}
                    onEditPicture={onEditPicture}
                    onDownload={onDownload}
                    post={post}
                    orgSlug={orgSlug}
                    className="mb-2"
                    embedded={embedded}
                />

                {likesCount > 0 && <div className="text-sm font-semibold px-2">{likesCount} likes</div>}
            </div>

            <div className="px-3 pb-3 pt-3 border-t">
                <Comments pictureId={mediaItem.id} initialComments={mediaItem.comments} />
            </div>
        </>
    );
};
